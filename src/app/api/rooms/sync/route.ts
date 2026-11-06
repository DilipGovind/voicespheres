import { NextResponse } from 'next/server';
import { Participant, LiveCaptionItem, ChatMessageItem } from '@/types/room';

interface RoomSyncState {
  participants: Map<string, Participant & { lastSeen: number }>;
  recentCaptions: LiveCaptionItem[];
  recentChat: ChatMessageItem[];
  currentStage?: string;
  activeSpeakerId?: string | null;
  lastUpdated: number;
}

// In-memory room sync store (per serverless container instance)
const roomsSyncMap = new Map<string, RoomSyncState>();

function getOrCreateRoomSync(roomId: string): RoomSyncState {
  let state = roomsSyncMap.get(roomId);
  if (!state) {
    state = {
      participants: new Map(),
      recentCaptions: [],
      recentChat: [],
      lastUpdated: Date.now(),
    };
    roomsSyncMap.set(roomId, state);
  }
  return state;
}

// Prune participants not seen in the last 20 seconds
function pruneStaleParticipants(state: RoomSyncState) {
  const now = Date.now();
  const cutoff = now - 20000;
  state.participants.forEach((p, id) => {
    if (p.lastSeen < cutoff) {
      state.participants.delete(id);
    }
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
  }

  const state = getOrCreateRoomSync(roomId);
  pruneStaleParticipants(state);

  const participantsList: Participant[] = [];
  state.participants.forEach((p) => {
    const { lastSeen, ...rest } = p;
    participantsList.push(rest);
  });

  return NextResponse.json({
    status: 'ok',
    roomId,
    participants: participantsList,
    recentCaptions: state.recentCaptions.slice(-20),
    recentChat: state.recentChat.slice(-30),
    currentStage: state.currentStage,
    activeSpeakerId: state.activeSpeakerId,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, user, action, eventData } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const state = getOrCreateRoomSync(roomId);

    // Update user heartbeat/presence
    if (user && user.id) {
      if (action === 'leave') {
        state.participants.delete(user.id);
      } else {
        state.participants.set(user.id, {
          ...user,
          lastSeen: Date.now(),
        });
      }
    }

    // Process eventData if provided
    if (eventData) {
      if (eventData.type === 'caption:new' && eventData.caption) {
        state.recentCaptions.push(eventData.caption);
        if (state.recentCaptions.length > 50) state.recentCaptions.shift();
      } else if (eventData.type === 'chat:message' && eventData.message) {
        state.recentChat.push(eventData.message);
        if (state.recentChat.length > 50) state.recentChat.shift();
      } else if (eventData.type === 'stage:change' && eventData.stage) {
        state.currentStage = eventData.stage;
        state.activeSpeakerId = eventData.activeSpeakerId ?? null;
      }
    }

    pruneStaleParticipants(state);

    const participantsList: Participant[] = [];
    state.participants.forEach((p) => {
      const { lastSeen, ...rest } = p;
      participantsList.push(rest);
    });

    return NextResponse.json({
      status: 'ok',
      roomId,
      participants: participantsList,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
