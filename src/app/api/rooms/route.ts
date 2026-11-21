import { NextResponse } from 'next/server';
import { Room } from '@/types/room';
import { serverRoomsMap } from '@/lib/server-rooms';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('id');

  if (roomId) {
    const room = serverRoomsMap.get(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ status: 'ok', room });
  }

  const allRooms = Array.from(serverRoomsMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return NextResponse.json({
    status: 'ok',
    totalRooms: allRooms.length,
    rooms: allRooms,
    timestamp: Date.now(),
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

    serverRoomsMap.set(newRoom.id, newRoom);

    const allRooms = Array.from(serverRoomsMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    return NextResponse.json(
      {
        status: 'created',
        room: newRoom,
        totalRooms: allRooms.length,
        rooms: allRooms,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error creating room' },
      { status: 500 }
    );
  }
}
