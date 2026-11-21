import { NextResponse } from 'next/server';
import { Room } from '@/types/room';
import {
  serverRoomsMap,
  registerServerRoomAsync,
  getRoomsWithLiveParticipants,
  ensureRoomsHydrated,
  findServerRoomAsync,
} from '@/lib/server-rooms';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('id');

  await ensureRoomsHydrated();
  const allRooms = getRoomsWithLiveParticipants();

  if (roomId) {
    const room = allRooms.find((r) => r.id === roomId) || (await findServerRoomAsync(roomId));
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
    await ensureRoomsHydrated();

    // Support batch registration from client sync
    if (body.batch && Array.isArray(body.batch)) {
      for (const r of body.batch) {
        if (r && r.id && r.name) {
          await registerServerRoomAsync(r);
        }
      }
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

    await registerServerRoomAsync(newRoom);

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
