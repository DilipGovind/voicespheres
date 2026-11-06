import { describe, it, expect } from 'vitest';
import { INITIAL_COMMUNITY_ROOMS } from '../src/lib/mock-rooms';
import { CaptionEngine, CaptionChunk } from '../src/lib/caption-engine';

describe('Voice Room LifeCycle & Accessibility Architecture', () => {
  it('loads inclusive preconfigured community rooms', () => {
    expect(INITIAL_COMMUNITY_ROOMS.length).toBeGreaterThanOrEqual(4);
    const aacRoom = INITIAL_COMMUNITY_ROOMS.find((r) => r.category === 'speech_aac');
    expect(aacRoom).toBeDefined();
    expect(aacRoom?.accessibilityFeatures.aacSupport).toBe(true);

    const neuroRoom = INITIAL_COMMUNITY_ROOMS.find((r) => r.category === 'neurodivergent');
    expect(neuroRoom).toBeDefined();
    expect(neuroRoom?.accessibilityFeatures.lowStimulation).toBe(true);
  });

  it('generates real-time manual and AAC caption chunks', () => {
    const engine = new CaptionEngine('user_123', 'Alice (AAC)', 'en-US');
    const receivedChunks: CaptionChunk[] = [];

    engine.onCaption((chunk) => {
      receivedChunks.push(chunk);
    });

    const emitted = engine.pushManualCaption('I would like to speak.', true);
    expect(emitted.text).toBe('I would like to speak.');
    expect(emitted.isAac).toBe(true);
    expect(emitted.speakerName).toBe('Alice (AAC)');
    expect(receivedChunks.length).toBe(1);
  });

  it('room participant roles include host, moderator, speaker, and listener', () => {
    const room = INITIAL_COMMUNITY_ROOMS[0];
    const roles = room.participants.map((p) => p.role);
    expect(roles).toContain('host');
    expect(roles).toContain('speaker');
    expect(roles).toContain('listener');
  });
});
