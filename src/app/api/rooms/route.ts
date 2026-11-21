import { NextResponse } from 'next/server';
import { Room } from '@/types/room';
import {
  serverRoomsMap,
  registerServerRoom,
  getRoomsWithLiveParticipants,
} from '@/lib/server-rooms';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('id');

  const allRooms = getRoomsWithLiveParticipants();

  if (roomId) {
    const room = allRooms.find((r) => r.id === roomId) || serverRoomsMap.get(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ status: 'ok', room });
  }

  return NextResponse.json({
    status: 'ok',
    totalRooms: allRooms.length,
    rooms: allRooms,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support batch registration from client sync
    if (body.batch && Array.isArray(body.batch)) {
      body.batch.forEach((r: Room) => {
        if (r && r.id && r.name) {
          registerServerRoom(r);
        }
      });
      const allRooms = getRoomsWithLiveParticipants();
      return NextResponse.json({
        status: 'synced',
        totalRooms: allRooms.length,
        rooms: allRooms,
      });
    }

    const newRoom: Room = body;

    if (!newRoom.id || !newRoom.name) {
      return NextResponse.json(
        { error: 'Room id and name are required' },
        { status: 400 }
      );
    }

    registerServerRoom(newRoom);

    const allRooms = getRoomsWithLiveParticipants();

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
