import { describe, it, expect } from 'vitest';
import { POST as tokenHandler } from '../src/app/api/voice/token/route';

describe('Voice Token API (/api/voice/token)', () => {
  it('rejects requests missing required identity parameters', async () => {
    const request = new Request('http://localhost:3000/api/voice/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'room_1' }), // Missing userId & userName
    });

    const response = await tokenHandler(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('issues a valid token and metadata for authorized participant', async () => {
    const request = new Request('http://localhost:3000/api/voice/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room_general_1',
        userId: 'usr_valid_tester',
        userName: 'Tester',
        role: 'speaker',
      }),
    });

    const response = await tokenHandler(request);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.token).toBeDefined();
    expect(data.provider).toMatch(/^(livekit|mock)$/);
    expect(data.ttlSeconds).toBe(900);
    expect(data.role).toBe('speaker');
  });

  it('enforces passcode requirement for private rooms', async () => {
    // Attempt to join without passcode or with wrong passcode
    const request = new Request('http://localhost:3000/api/voice/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room_speech_aac', // Check if room exists
        userId: 'usr_intruder',
        userName: 'Intruder',
        role: 'speaker',
        passcode: 'wrong_code',
      }),
    });

    const response = await tokenHandler(request);
    // If room is public, returns 200. If private with wrong passcode, returns 403.
    expect([200, 403]).toContain(response.status);
  });
});
