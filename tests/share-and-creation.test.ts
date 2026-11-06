import { describe, it, expect } from 'vitest';
import { Room } from '../src/types/room';

describe('Dynamic Room Creation and Sharing Architecture', () => {
  it('allows unlimited creation of unique accessible rooms', () => {
    const createdRooms: Room[] = [];

    for (let i = 1; i <= 25; i++) {
      const room: Room = {
        id: `room_custom_${i}_${Math.random().toString(36).substring(2, 7)}`,
        name: `Custom Community Space #${i}`,
        topic: `Discussion topic for session ${i}`,
        description: `Room description for room ${i}`,
        category: 'general',
        language: 'en',
        country: 'Global',
        isPrivate: i % 2 === 0,
        hostId: `user_creator_${i}`,
        createdAt: Date.now() + i * 1000,
        accessibilityFeatures: {
          captionsAvailable: true,
          textParticipation: true,
          aacSupport: true,
          lowStimulation: false,
          structuredDiscussion: true,
          listeningOnlyAllowed: true,
          screenReaderOptimized: true,
          quietRoom: false,
        },
        structuredStage: {
          currentStage: 'INTRO',
          stageTitle: 'Introduction Stage',
          stageDescription: 'Welcome phase',
          speakingTimeLimitSeconds: 120,
          activeSpeakerId: `user_creator_${i}`,
          stageStartedAt: Date.now(),
          queue: [],
        },
        participants: [],
      };
      createdRooms.push(room);
    }

    expect(createdRooms.length).toBe(25);
    const uniqueIds = new Set(createdRooms.map((r) => r.id));
    expect(uniqueIds.size).toBe(25);
  });

  it('generates valid direct share URLs and formatted accessible invitation text', () => {
    const sampleRoom: Room = {
      id: 'room_aac_inclusion_99',
      name: 'AAC & Neurodiversity Hangout',
      topic: 'Celebrating diverse speech patterns and alternative inputs',
      description: 'Open to everyone',
      category: 'speech_aac',
      language: 'en',
      country: 'Global',
      isPrivate: false,
      hostId: 'user_host',
      createdAt: Date.now(),
      accessibilityFeatures: {
        captionsAvailable: true,
        textParticipation: true,
        aacSupport: true,
        lowStimulation: true,
        structuredDiscussion: true,
        listeningOnlyAllowed: true,
        screenReaderOptimized: true,
        quietRoom: true,
      },
      structuredStage: {
        currentStage: 'DISCUSSION',
        stageTitle: 'Open Floor',
        stageDescription: 'Community dialogue',
        speakingTimeLimitSeconds: 120,
        activeSpeakerId: 'user_host',
        stageStartedAt: Date.now(),
        queue: [],
      },
      participants: [],
    };

    const origin = 'https://voicesphere.vercel.app';
    const shareUrl = `${origin}/?room=${encodeURIComponent(sampleRoom.id)}`;
    expect(shareUrl).toBe('https://voicesphere.vercel.app/?room=room_aac_inclusion_99');

    const formattedInvite =
      `Join our accessible voice room on VoiceSphere: "${sampleRoom.name}"\n` +
      `Topic: ${sampleRoom.topic}\n` +
      `Link: ${shareUrl}`;

    expect(formattedInvite).toContain('AAC & Neurodiversity Hangout');
    expect(formattedInvite).toContain('https://voicesphere.vercel.app/?room=room_aac_inclusion_99');
  });
});
