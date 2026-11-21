import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { Room } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Maximum capacity for small-group worldwide testing
const DEFAULT_MAX_PARTICIPANTS = 12;

// In-memory room storage matching /api/rooms
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

export async function POST(request: Request) {
  try {
    hydrateRooms();

    const body = await request.json();
    const { roomId, userId, userName, role = 'speaker', passcode } = body;

    if (!roomId || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId, userId, and userName are mandatory' },
        { status: 400 }
      );
    }

    const room = globalRoomsMap.get(roomId);

    // If room is known, validate room-level permissions
    if (room) {
      // 1. Validate private room passcode
      if (room.isPrivate) {
        if (!passcode || passcode !== room.passcode) {
          return NextResponse.json(
            { error: 'Invalid or missing passcode for private room', code: 'UNAUTHORIZED_PRIVATE_ROOM' },
            { status: 403 }
          );
        }
      }

      // 2. Validate room lock state
      if ((room as any).isLocked && role !== 'host') {
        const isExistingParticipant = room.participants?.some((p) => p.id === userId);
        if (!isExistingParticipant) {
          return NextResponse.json(
            { error: 'Room has been locked by the host. No new participants may join.', code: 'ROOM_LOCKED' },
            { status: 403 }
          );
        }
      }

      // 3. Validate small-group testing capacity limits
      const maxAllowed = (room as any).maxParticipants || DEFAULT_MAX_PARTICIPANTS;
      const currentCount = room.participants?.length || 0;
      const isExistingParticipant = room.participants?.some((p) => p.id === userId);

      if (!isExistingParticipant && currentCount >= maxAllowed) {
        return NextResponse.json(
          {
            error: `Room capacity limit reached (max ${maxAllowed} participants for stable testing).`,
            code: 'ROOM_FULL',
            maxParticipants: maxAllowed,
          },
          { status: 403 }
        );
      }
    }

    // Role capabilities
    const canPublish = role === 'host' || role === 'moderator' || role === 'speaker';
    const canSubscribe = true;

    // Check LiveKit credentials from environment
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // If LiveKit credentials exist, generate a secure short-lived token
    if (livekitUrl && apiKey && apiSecret) {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: userId,
        name: userName,
        ttl: '15m', // Short-lived 15 minutes TTL for security
      });

      at.addGrant({
        room: roomId,
        roomJoin: true,
        canPublish,
        canSubscribe,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return NextResponse.json({
        status: 'ok',
        provider: 'livekit',
        serverUrl: livekitUrl,
        token,
        ttlSeconds: 900,
        role,
        roomLocked: !!(room as any)?.isLocked,
        maxParticipants: (room as any)?.maxParticipants || DEFAULT_MAX_PARTICIPANTS,
      });
    }

    // Safe fallback mode: LiveKit credentials not yet configured
    return NextResponse.json({
      status: 'ok',
      provider: 'mock',
      serverUrl: 'mock://offline',
      token: `mock_token_${userId}_${roomId}`,
      ttlSeconds: 900,
      role,
      roomLocked: !!(room as any)?.isLocked,
      maxParticipants: (room as any)?.maxParticipants || DEFAULT_MAX_PARTICIPANTS,
      note: 'LiveKit server credentials are not set in environment. Running in safe local offline mock mode. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to enable remote WebRTC SFU.',
    });
  } catch (error: any) {
    console.error('Error generating voice token:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while generating voice token' },
      { status: 500 }
    );
  }
}
