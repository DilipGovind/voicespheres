import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Room } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';

// In-memory room storage
const globalRoomsMap = new Map<string, Room>();

// Seed initial rooms
INITIAL_COMMUNITY_ROOMS.forEach((room) => {
  globalRoomsMap.set(room.id, room);
});

// Cache file path in temporary storage
const TMP_FILE = path.join(os.tmpdir(), 'voicesphere_created_rooms.json');

function hydrateFromTmp() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, 'utf8');
      const parsed: Room[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((r) => {
          if (r && r.id) {
            globalRoomsMap.set(r.id, r);
          }
        });
      }
    }
  } catch {
    // ignore
  }
}

function persistToTmp() {
  try {
    const list = Array.from(globalRoomsMap.values());
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), 'utf8');
  } catch {
    // ignore
  }
}

// Initial hydration
hydrateFromTmp();

export async function GET(request: Request) {
  hydrateFromTmp();

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

    hydrateFromTmp();
    globalRoomsMap.set(newRoom.id, newRoom);
    persistToTmp();

    const allRooms = Array.from(globalRoomsMap.values()).sort(
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
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid room payload' },
      { status: 400 }
    );
  }
}
