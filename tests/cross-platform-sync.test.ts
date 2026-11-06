import { describe, it, expect, vi, beforeEach } from 'vitest';
import { realtimeClient } from '../src/lib/socket-client';
import { Participant } from '../src/types/room';
import { webRTCManager } from '../src/lib/webrtc-manager';

describe('Cross-Platform Real-Time Sync & Multi-Device Presence', () => {
  const mockUserWindows: Participant = {
    id: 'user_windows_10',
    name: 'Windows User',
    avatar: 'WU',
    role: 'host',
    isMuted: false,
    isSpeaking: false,
    isHandRaised: false,
    isAacUser: false,
    volume: 100,
    joinedAt: Date.now(),
  };

  const mockUserAndroid: Participant = {
    id: 'user_android_12',
    name: 'Android User',
    avatar: 'AU',
    role: 'speaker',
    isMuted: true,
    isSpeaking: false,
    isHandRaised: true,
    isAacUser: true,
    volume: 100,
    joinedAt: Date.now(),
  };

  beforeEach(() => {
    // Reset mocks
    vi.restoreAllMocks();
  });

  it('allows clients to register and receive cross-device presence events', () => {
    let receivedUser: Participant | null = null;

    const unsub = realtimeClient.on('presence:heartbeat', (data) => {
      receivedUser = data.user;
    });

    // Simulate cross-device heartbeat arrival (e.g. from Android to Windows)
    (realtimeClient as any).handleIncomingEvent('presence:heartbeat', {
      user: mockUserAndroid,
    });

    expect(receivedUser).not.toBeNull();
    expect((receivedUser as any)?.id).toBe('user_android_12');
    expect((receivedUser as any)?.isAacUser).toBe(true);
    expect((receivedUser as any)?.isHandRaised).toBe(true);

    unsub();
  });

  it('dispatches WebRTC peer signaling messages to the intended target user', () => {
    let capturedSignal: any = null;

    const unsub = realtimeClient.on('webrtc:signal', (data) => {
      capturedSignal = data;
    });

    (realtimeClient as any).currentUser = mockUserWindows;
    (realtimeClient as any).roomId = 'room_inclusive_test';

    // Mock fetch for outgoing signal
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ status: 'ok' })))
    );

    realtimeClient.sendSignal('user_android_12', {
      type: 'offer',
      sdp: 'mock_sdp_offer_data',
    });

    expect(fetchSpy).toHaveBeenCalled();

    // Verify incoming signal routing
    (realtimeClient as any).handleIncomingEvent('webrtc:signal', {
      senderUserId: 'user_android_12',
      targetUserId: 'user_windows_10',
      signal: { type: 'answer', sdp: 'mock_sdp_answer_data' },
    });

    expect(capturedSignal).not.toBeNull();
    expect(capturedSignal.targetUserId).toBe('user_windows_10');
    expect(capturedSignal.signal.type).toBe('answer');

    unsub();
  });

  it('WebRTCManager attaches signal sender and creates silent fallback stream', () => {
    const signalSpy = vi.fn();
    webRTCManager.setSignalSender(signalSpy);

    const stream = webRTCManager.createSilentAudioStream();
    expect(stream).toBeDefined();

    webRTCManager.setMute(true);
    // Silent stream should not throw
    webRTCManager.stopLocalStream();
  });
});
