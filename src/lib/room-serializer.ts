import { Room, RoomCategory } from '@/types/room';

export function serializeRoomToUrl(room: Room, baseUrl = ''): string {
  let origin = baseUrl;
  if (!origin && typeof window !== 'undefined') {
    origin = window.location.origin;
  }
  if (!origin) {
    origin = 'https://voicesphere.vercel.app';
  }

  const url = new URL(origin);
  url.searchParams.set('room', room.id);
  url.searchParams.set('name', room.name);
  if (room.topic) url.searchParams.set('topic', room.topic);
  if (room.category) url.searchParams.set('cat', room.category);
  if (room.language) url.searchParams.set('lang', room.language);

  // Accessibility flags
  if (room.accessibilityFeatures.captionsAvailable) url.searchParams.set('cap', '1');
  if (room.accessibilityFeatures.aacSupport) url.searchParams.set('aac', '1');
  if (room.accessibilityFeatures.lowStimulation) url.searchParams.set('lowstim', '1');
  if (room.accessibilityFeatures.structuredDiscussion) url.searchParams.set('struct', '1');
  if (room.accessibilityFeatures.quietRoom) url.searchParams.set('quiet', '1');

  return url.toString();
}

export function deserializeRoomFromUrl(
  searchParams: URLSearchParams,
  knownRooms: Room[] = []
): Room | null {
  const roomId = searchParams.get('room');
  if (!roomId) return null;

  // 1. Check if already known in memory or built-in rooms
  const existing = knownRooms.find((r) => r.id === roomId);
  if (existing) return existing;

  // 2. Decode from portable URL parameters
  const name = searchParams.get('name');
  if (name) {
    const topic = searchParams.get('topic') || 'Open Community Discussion';
    const category = (searchParams.get('cat') as RoomCategory) || 'general';
    const language = searchParams.get('lang') || 'en';
    const captionsAvailable = searchParams.get('cap') === '1';
    const aacSupport = searchParams.get('aac') === '1';
    const lowStimulation = searchParams.get('lowstim') === '1';
    const structuredDiscussion = searchParams.get('struct') === '1';
    const quietRoom = searchParams.get('quiet') === '1';

    const reconstructedRoom: Room = {
      id: roomId,
      name: name,
      topic: topic,
      description: 'Shared accessible voice room',
      category,
      language,
      country: 'Global',
      isPrivate: false,
      hostId: 'shared_host',
      createdAt: Date.now(),
      accessibilityFeatures: {
        captionsAvailable,
        textParticipation: true,
        aacSupport,
        lowStimulation,
        structuredDiscussion,
        listeningOnlyAllowed: true,
        screenReaderOptimized: true,
        quietRoom,
      },
      structuredStage: {
        currentStage: structuredDiscussion ? 'INTRO' : 'DISCUSSION',
        stageTitle: 'Discussion Stage',
        stageDescription: 'Community open floor',
        speakingTimeLimitSeconds: 120,
        activeSpeakerId: null,
        stageStartedAt: Date.now(),
        queue: [],
      },
      participants: [
        {
          id: 'user_host_' + roomId.slice(-4),
          name: 'Room Creator',
          avatar: 'RC',
          role: 'host',
          isMuted: false,
          isSpeaking: false,
          isHandRaised: false,
          isAacUser: aacSupport,
          volume: 95,
          joinedAt: Date.now() - 60000,
        },
      ],
    };

    return reconstructedRoom;
  }

  return null;
}
