import { NextResponse } from 'next/server';
import {
  getOrCreateRoomSync,
  pruneStaleParticipants,
  touchRoomParticipant,
} from '@/lib/server-rooms';

export const runtime = 'edge';

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
      touchRoomParticipant(roomId, user, action);
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
