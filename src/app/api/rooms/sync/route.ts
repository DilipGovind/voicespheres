import { NextResponse } from 'next/server';
import { Participant, LiveCaptionItem, ChatMessageItem } from '@/types/room';

export const runtime = 'edge';

interface RoomSyncState {
  participants: Map<string, Participant & { lastSeen: number }>;
  recentCaptions: LiveCaptionItem[];
  recentChat: ChatMessageItem[];
  currentStage?: string;
  activeSpeakerId?: string | null;
  lastUpdated: number;
}

// In-memory room sync store (per edge instance)
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

  return NextResponse.json({
    status: 'ok',
    participants: Array.from(state.participants.values()),
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
    const { roomId, user, action, caption, chatMessage, stage, activeSpeakerId } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const state = getOrCreateRoomSync(roomId);
    state.lastUpdated = Date.now();

    if (user && user.id) {
      if (action === 'leave') {
        state.participants.delete(user.id);
      } else {
        state.participants.set(user.id, { ...user, lastSeen: Date.now() });
      }
    }

    if (caption) {
      state.recentCaptions.push(caption);
      if (state.recentCaptions.length > 50) state.recentCaptions.shift();
    }

    if (chatMessage) {
      state.recentChat.push(chatMessage);
      if (state.recentChat.length > 50) state.recentChat.shift();
    }

    if (stage) state.currentStage = stage;
    if (activeSpeakerId !== undefined) state.activeSpeakerId = activeSpeakerId;

    pruneStaleParticipants(state);

    return NextResponse.json({
      status: 'ok',
      participantsCount: state.participants.size,
      participants: Array.from(state.participants.values()),
      recentCaptions: state.recentCaptions.slice(-20),
      recentChat: state.recentChat.slice(-30),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Sync error' }, { status: 500 });
  }
}
