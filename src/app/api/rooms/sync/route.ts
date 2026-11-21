import { NextResponse } from 'next/server';
import {
  getOrCreateRoomSync,
  pruneStaleParticipants,
  touchRoomParticipant,
  addRoomSignal,
  getRoomSignalsForUser,
} from '@/lib/server-rooms';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const userId = searchParams.get('userId');
  const since = parseInt(searchParams.get('since') || '0', 10);

  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
  }

  const state = getOrCreateRoomSync(roomId);
  pruneStaleParticipants(state);

  const pendingSignals = userId ? getRoomSignalsForUser(roomId, userId, since) : [];

  return NextResponse.json({
    status: 'ok',
    participants: Array.from(state.participants.values()),
    recentCaptions: state.recentCaptions.slice(-20),
    recentChat: state.recentChat.slice(-30),
    pendingSignals,
    currentStage: state.currentStage,
    activeSpeakerId: state.activeSpeakerId,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      user,
      action,
      caption,
      chatMessage,
      stage,
      activeSpeakerId,
      signal,
      userId,
      since,
    } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const state = getOrCreateRoomSync(roomId);
    state.lastUpdated = Date.now();

    if (user && user.id) {
      touchRoomParticipant(roomId, user, action);
    }

    // Process incoming WebRTC signaling for cross-device peer traversal
    if (signal && signal.senderUserId && signal.targetUserId) {
      addRoomSignal(roomId, signal.senderUserId, signal.targetUserId, signal.signal);
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

    const targetUserId = userId || user?.id;
    const pendingSignals = targetUserId ? getRoomSignalsForUser(roomId, targetUserId, since || 0) : [];

    return NextResponse.json({
      status: 'ok',
      participantsCount: state.participants.size,
      participants: Array.from(state.participants.values()),
      recentCaptions: state.recentCaptions.slice(-20),
      recentChat: state.recentChat.slice(-30),
      pendingSignals,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Sync error' }, { status: 500 });
  }
}
