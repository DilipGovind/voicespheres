import { NextResponse } from 'next/server';
import { Room } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';

// In-memory room storage for dynamically created rooms
// Persists across requests within the serverless container instance
const globalRoomsMap = new Map<string, Room>();

// Seed initial rooms
INITIAL_COMMUNITY_ROOMS.forEach((room) => {
  globalRoomsMap.set(room.id, room);
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('id');

  if (roomId) {
    const room = globalRoomsMap.get(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ status: 'ok', room });
  }

  const allRooms = Array.from(globalRoomsMap.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return NextResponse.json({
    status: 'ok',
    totalRooms: allRooms.length,
    rooms: allRooms,
  });
}

export async function POST(request: Request) {
  try {
    const newRoom: Room = await request.json();

    if (!newRoom.id || !newRoom.name) {
      return NextResponse.json(
        { error: 'Room id and name are required' },
        { status: 400 }
      );
    }

    globalRoomsMap.set(newRoom.id, newRoom);

    return NextResponse.json(
      {
        status: 'created',
        room: newRoom,
        shareUrl: `/?room=${encodeURIComponent(newRoom.id)}`,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid room payload' },
      { status: 400 }
    );
  }
}
