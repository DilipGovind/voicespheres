import { NextResponse } from 'next/server';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    totalRooms: INITIAL_COMMUNITY_ROOMS.length,
    rooms: INITIAL_COMMUNITY_ROOMS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: 'created',
      room: body,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid room payload' },
      { status: 400 }
    );
  }
}
