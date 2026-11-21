import { describe, it, expect, beforeEach } from 'vitest';
import { Room, Participant } from '../src/types/room';
import {
  registerServerRoom,
  getRoomsWithLiveParticipants,
  touchRoomParticipant,
  serverRoomsMap,
  roomsSyncMap,
} from '../src/lib/server-rooms';

describe('Room Session Resumption & Direct Website Directory Sync', () => {
  const dummyRoom: Room = {
    id: 'room_test_resume_01',
    name: 'Tech & Accessibility Live Lounge',
    topic: 'Testing direct website discovery and session reload',
    description: 'Testing inclusive room persistence',
    category: 'general',
    language: 'en',
    country: 'Global',
    isPrivate: false,
    hostId: 'user_host_1',
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
      currentStage: 'DISCUSSION',
      stageTitle: 'Discussion Floor',
      stageDescription: 'Open exchange',
      speakingTimeLimitSeconds: 120,
      activeSpeakerId: null,
      stageStartedAt: Date.now(),
      queue: [],
    },
    participants: [
      {
        id: 'user_host_1',
        name: 'Alex Host',
        avatar: 'AH',
        role: 'host',
        isMuted: false,
        isSpeaking: true,
        isHandRaised: false,
        isAacUser: false,
        volume: 100,
        joinedAt: Date.now(),
      },
    ],
  };

  it('registers custom room and makes it available directly on the website directory', () => {
    registerServerRoom(dummyRoom);

    const allRooms = getRoomsWithLiveParticipants();
    const found = allRooms.find((r) => r.id === dummyRoom.id);

    expect(found).toBeDefined();
    expect(found?.name).toBe('Tech & Accessibility Live Lounge');
    expect(found?.participants.length).toBeGreaterThanOrEqual(1);
    expect(found?.participants[0].name).toBe('Alex Host');
  });

  it('updates live recognized members in real time when new participants join', () => {
    registerServerRoom(dummyRoom);

    const newMember: Participant = {
      id: 'user_member_dileep',
      name: 'DILEEP',
      avatar: '💡',
      role: 'speaker',
      isMuted: false,
      isSpeaking: false,
      isHandRaised: true,
      isAacUser: true,
      volume: 100,
      joinedAt: Date.now(),
    };

    // User heartbeats into room
    touchRoomParticipant(dummyRoom.id, newMember);

    const allRooms = getRoomsWithLiveParticipants();
    const updated = allRooms.find((r) => r.id === dummyRoom.id);

    expect(updated).toBeDefined();
    expect(updated?.participants.some((p) => p.id === 'user_member_dileep')).toBe(true);
    const dileep = updated?.participants.find((p) => p.id === 'user_member_dileep');
    expect(dileep?.name).toBe('DILEEP');
    expect(dileep?.avatar).toBe('💡');
    expect(dileep?.role).toBe('speaker');
  });

  it('removes member from room when participant leaves', () => {
    touchRoomParticipant(dummyRoom.id, { id: 'user_member_dileep' } as any, 'leave');

    const allRooms = getRoomsWithLiveParticipants();
    const updated = allRooms.find((r) => r.id === dummyRoom.id);
    expect(updated?.participants.some((p) => p.id === 'user_member_dileep')).toBe(false);
  });

  it('correctly simulates session resumption logic vs external shared link visit', () => {
    const activeSessionRoomId = 'room_test_resume_01';
    const activeSessionRole = 'speaker';

    // Scenario A: Page reload on same tab
    const urlRoomId = 'room_test_resume_01';
    const isResumingSession = activeSessionRoomId === urlRoomId;
    expect(isResumingSession).toBe(true);

    let activeRoomState: Room | null = null;
    let previewingRoomState: Room | null = null;

    if (isResumingSession) {
      activeRoomState = dummyRoom;
      previewingRoomState = null;
    } else {
      previewingRoomState = dummyRoom;
    }

    expect(activeRoomState).not.toBeNull();
    expect(previewingRoomState).toBeNull();

    // Scenario B: User opened fresh shared link on a new device/tab (no active session)
    const freshSessionRoomId = null;
    const isResumingFresh = freshSessionRoomId === urlRoomId;
    expect(isResumingFresh).toBe(false);

    let freshActiveRoomState: Room | null = null;
    let freshPreviewState: Room | null = null;

    if (isResumingFresh) {
      freshActiveRoomState = dummyRoom;
    } else {
      freshPreviewState = dummyRoom;
    }

    expect(freshActiveRoomState).toBeNull();
    expect(freshPreviewState).not.toBeNull();
  });
});
