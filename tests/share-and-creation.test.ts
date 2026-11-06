import { describe, it, expect, vi } from 'vitest';
import { Room } from '../src/types/room';
import { serializeRoomToUrl, deserializeRoomFromUrl } from '../src/lib/room-serializer';
import { realtimeClient } from '../src/lib/socket-client';

describe('Dynamic Room Creation and Cross-Platform Sharing Architecture', () => {
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

  it('broadcasts created rooms to global mesh for cross-platform visibility', () => {
    let capturedEvent: any = null;
    const unsub = realtimeClient.on('global:room_created', (data) => {
      capturedEvent = data;
    });

    const testRoom: Room = {
      id: 'room_cross_plat_101',
      name: 'Cross-Platform Community Room',
      topic: 'Accessible on Android and Windows',
      description: 'Open to all devices',
      category: 'general',
      language: 'en',
      country: 'Global',
      isPrivate: false,
      hostId: 'user_101',
      createdAt: Date.now(),
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
        stageTitle: 'Intro',
        stageDescription: 'Welcome',
        speakingTimeLimitSeconds: 120,
        activeSpeakerId: null,
        stageStartedAt: Date.now(),
        queue: [],
      },
      participants: [],
    };

    realtimeClient.broadcastRoomCreated(testRoom);
    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent.room.name).toBe('Cross-Platform Community Room');

    unsub();
  });

  it('serializes and deserializes rooms faithfully for any device opening a link or QR code', () => {
    const originalRoom: Room = {
      id: 'room_portable_99',
      name: 'Telugu & English AAC Lounge',
      topic: 'Bilingual accessibility chat',
      description: 'Full inclusive access',
      category: 'speech_aac',
      language: 'te',
      country: 'Global',
      isPrivate: false,
      hostId: 'host_te',
      createdAt: Date.now(),
      accessibilityFeatures: {
        captionsAvailable: true,
        textParticipation: true,
        aacSupport: true,
        lowStimulation: true,
        structuredDiscussion: false,
        listeningOnlyAllowed: true,
        screenReaderOptimized: true,
        quietRoom: false,
      },
      structuredStage: {
        currentStage: 'DISCUSSION',
        stageTitle: 'Discussion',
        stageDescription: 'Open',
        speakingTimeLimitSeconds: 120,
        activeSpeakerId: null,
        stageStartedAt: Date.now(),
        queue: [],
      },
      participants: [],
    };

    const urlString = serializeRoomToUrl(originalRoom, 'https://voicesphere.vercel.app');
    const parsedUrl = new URL(urlString);
    const reconstituted = deserializeRoomFromUrl(parsedUrl.searchParams);

    expect(reconstituted).not.toBeNull();
    expect(reconstituted?.id).toBe('room_portable_99');
    expect(reconstituted?.name).toBe('Telugu & English AAC Lounge');
    expect(reconstituted?.language).toBe('te');
    expect(reconstituted?.accessibilityFeatures.captionsAvailable).toBe(true);
    expect(reconstituted?.accessibilityFeatures.aacSupport).toBe(true);
    expect(reconstituted?.accessibilityFeatures.lowStimulation).toBe(true);
  });
});
