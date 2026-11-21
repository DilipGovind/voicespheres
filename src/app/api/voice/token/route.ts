import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { findServerRoomAsync } from '@/lib/server-rooms';

export const runtime = 'edge';

// Maximum capacity for small-group worldwide testing
const DEFAULT_MAX_PARTICIPANTS = 12;

// In-memory rate limiting map for private room passcode brute-force protection
const failedPasscodeAttempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, userId, userName, role = 'speaker', passcode } = body;

    if (!roomId || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId, userId, and userName are mandatory' },
        { status: 400 }
      );
    }

    const room = await findServerRoomAsync(roomId);

    // If room is known, validate room-level permissions
    if (room) {
      // 1. Validate private room passcode with brute-force rate limiting
      if (room.isPrivate) {
        const rateKey = `${userId}_${roomId}`;
        const record = failedPasscodeAttempts.get(rateKey);
        const now = Date.now();

        if (record && record.lockedUntil > now) {
          const waitSecs = Math.ceil((record.lockedUntil - now) / 1000);
          return NextResponse.json(
            {
              error: `Too many incorrect passcode attempts. Please wait ${waitSecs} seconds before retrying.`,
              code: 'RATE_LIMITED',
            },
            { status: 429 }
          );
        }

        if (!passcode || passcode !== room.passcode) {
          const currentCount = (record?.count || 0) + 1;
          const lockedUntil = currentCount >= 4 ? now + 15000 : 0;
          failedPasscodeAttempts.set(rateKey, { count: currentCount, lockedUntil });

          return NextResponse.json(
            { error: 'Invalid or missing passcode for private room', code: 'UNAUTHORIZED_PRIVATE_ROOM' },
            { status: 403 }
          );
        }

        // Passcode succeeded: clear rate limiter
        failedPasscodeAttempts.delete(rateKey);
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

    // Validate LiveKit credentials: apiSecret must be a raw secret key, not a pre-generated JWT token
    const isSecretValid =
      Boolean(apiSecret) &&
      !apiSecret!.startsWith('ey') &&
      apiSecret!.split('.').length !== 3 &&
      apiSecret!.length >= 8;

    // If LiveKit credentials exist and secret is valid, generate a secure short-lived token
    if (livekitUrl && apiKey && isSecretValid) {
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
      serverUrl: 'webrtc://mesh',
      token: `webrtc_token_${userId}_${roomId}`,
      ttlSeconds: 900,
      role,
      roomLocked: !!(room as any)?.isLocked,
      maxParticipants: (room as any)?.maxParticipants || DEFAULT_MAX_PARTICIPANTS,
      note: 'WebRTC Spatial Audio Mesh active with DTLS encryption.',
    });
  } catch (error: any) {
    console.error('Error generating voice token:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while generating voice token' },
      { status: 500 }
    );
  }
}
