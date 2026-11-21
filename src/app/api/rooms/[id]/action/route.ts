import { NextResponse } from 'next/server';
import { Room, Participant } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';
import fs from 'fs';
import path from 'path';
import os from 'os';

const globalRoomsMap = new Map<string, Room>();
INITIAL_COMMUNITY_ROOMS.forEach((r) => globalRoomsMap.set(r.id, r));

const TMP_FILE = path.join(os.tmpdir(), 'voicesphere_created_rooms.json');

function hydrateRooms() {
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
  } catch {}
}

function persistRooms() {
  try {
    const list = Array.from(globalRoomsMap.values());
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), 'utf8');
  } catch {}
}

// In-memory rate limiting map: ipOrUser -> timestamp[]
const rateLimits = new Map<string, number[]>();
function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimits.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateLimits.set(key, timestamps);
  return true;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    hydrateRooms();

    const roomId = params.id;
    const body = await request.json();
    const { hostUserId, action, targetUserId, newRole } = body;

    if (!roomId || !hostUserId || !action) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: roomId, hostUserId, and action' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(hostUserId, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many host actions. Please slow down.' },
        { status: 429 }
      );
    }

    const room = globalRoomsMap.get(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify host permission: either hostId matches or user has 'host' / 'moderator' role in participants
    const hostParticipant = room.participants?.find((p) => p.id === hostUserId);
    const isAuthorized =
      room.hostId === hostUserId ||
      hostParticipant?.role === 'host' ||
      hostParticipant?.role === 'moderator';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have host or moderator privileges in this room' },
        { status: 403 }
      );
    }

    let message = '';

    switch (action) {
      case 'toggle_lock': {
        const nextLock = !(room as any).isLocked;
        (room as any).isLocked = nextLock;
        message = nextLock ? 'Room is now locked' : 'Room is now unlocked';
        break;
      }

      case 'mute_participant': {
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
        }
        if (room.participants) {
          room.participants = room.participants.map((p) =>
            p.id === targetUserId ? { ...p, isMuted: true } : p
          );
        }
        message = `Participant ${targetUserId} muted`;
        break;
      }

      case 'change_role': {
        if (!targetUserId || !newRole) {
          return NextResponse.json({ error: 'targetUserId and newRole required' }, { status: 400 });
        }
        if (room.participants) {
          room.participants = room.participants.map((p) =>
            p.id === targetUserId ? { ...p, role: newRole } : p
          );
        }
        message = `Role updated to ${newRole} for participant ${targetUserId}`;
        break;
      }

      case 'kick_participant': {
        if (!targetUserId) {
          return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
        }
        if (room.participants) {
          room.participants = room.participants.filter((p) => p.id !== targetUserId);
        }
        message = `Participant ${targetUserId} removed from room`;
        break;
      }

      case 'end_room': {
        (room as any).isClosed = true;
        room.participants = [];
        message = 'Room ended by host';
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    persistRooms();

    return NextResponse.json({
      status: 'ok',
      action,
      message,
      room,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing room action' },
      { status: 500 }
    );
  }
}
