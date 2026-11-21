import { describe, it, expect, vi } from 'vitest';
import { MockVoiceAdapter } from '../src/lib/voice/mock-adapter';
import { getVoiceAdapter } from '../src/lib/voice/adapter-factory';

describe('Voice Adapter Layer', () => {
  it('instantiates MockVoiceAdapter with initial disconnected state', () => {
    const adapter = new MockVoiceAdapter();
    expect(adapter.id).toBe('mock');
    expect(adapter.getConnectionState()).toBe('disconnected');
    expect(adapter.isMuted()).toBe(false);
  });

  it('connects successfully to mock voice room', async () => {
    const adapter = new MockVoiceAdapter();
    const stateChanges: string[] = [];

    adapter.onConnectionStateChange((state) => {
      stateChanges.push(state);
    });

    await adapter.connect({
      provider: 'mock',
      serverUrl: 'mock://offline',
      roomName: 'test_room_1',
      participantIdentity: 'user_test_1',
      participantName: 'Alice',
      role: 'speaker',
      token: 'mock_token',
    });

    expect(adapter.getConnectionState()).toBe('connected');
    expect(stateChanges).toContain('connecting');
    expect(stateChanges).toContain('connected');
  });

  it('handles microphone muting and unmuting', async () => {
    const adapter = new MockVoiceAdapter();
    await adapter.connect({
      provider: 'mock',
      serverUrl: 'mock://offline',
      roomName: 'test_room_1',
      participantIdentity: 'user_test_1',
      participantName: 'Alice',
      role: 'speaker',
    });

    await adapter.setMuted(true);
    expect(adapter.isMuted()).toBe(true);

    await adapter.setMuted(false);
    expect(adapter.isMuted()).toBe(false);
  });

  it('disconnects and resets connection state', async () => {
    const adapter = new MockVoiceAdapter();
    await adapter.connect({
      provider: 'mock',
      serverUrl: 'mock://offline',
      roomName: 'test_room_1',
      participantIdentity: 'user_test_1',
      participantName: 'Alice',
      role: 'speaker',
    });

    await adapter.disconnect();
    expect(adapter.getConnectionState()).toBe('disconnected');
  });

  it('factory returns MockVoiceAdapter for offline/test environments', () => {
    const adapter = getVoiceAdapter('mock');
    expect(adapter.id).toBe('mock');
  });
});
