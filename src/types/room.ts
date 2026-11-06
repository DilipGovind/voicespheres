export type RoomCategory =
  | 'disability_community'
  | 'neurodivergent'
  | 'blind_low_vision'
  | 'deaf_hard_of_hearing'
  | 'speech_aac'
  | 'mobility_wheelchair'
  | 'caregivers'
  | 'inclusive_education'
  | 'accessible_employment'
  | 'disability_rights'
  | 'general';

export type StructuredStage =
  | 'INTRO'
  | 'TOPIC'
  | 'QUEUE'
  | 'DISCUSSION'
  | 'QA'
  | 'CLOSING';

export type ParticipantRole = 'host' | 'moderator' | 'speaker' | 'listener';

export interface AccessibilityFeatureBadges {
  captionsAvailable: boolean;
  textParticipation: boolean;
  aacSupport: boolean;
  lowStimulation: boolean;
  structuredDiscussion: boolean;
  listeningOnlyAllowed: boolean;
  screenReaderOptimized: boolean;
  quietRoom: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: ParticipantRole;
  isMuted: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  isAacUser: boolean;
  volume: number;
  joinedAt: number;
  country?: string;
  pronouns?: string;
}

export interface StructuredStageInfo {
  currentStage: StructuredStage;
  stageTitle: string;
  stageDescription: string;
  speakingTimeLimitSeconds: number; // e.g. 120
  activeSpeakerId: string | null;
  stageStartedAt: number;
  queue: string[]; // participant IDs in speaking queue
}

export interface Room {
  id: string;
  name: string;
  topic: string;
  description: string;
  category: RoomCategory;
  language: string;
  country: string;
  isPrivate: boolean;
  passcode?: string;
  hostId: string;
  createdAt: number;
  accessibilityFeatures: AccessibilityFeatureBadges;
  structuredStage: StructuredStageInfo;
  participants: Participant[];
  contentWarning?: {
    enabled: boolean;
    tags: string[];
    description: string;
  };
}

export interface LiveCaptionItem {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isAac?: boolean;
  language: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isAac?: boolean;
  isAnnouncement?: boolean;
  isSystem?: boolean;
}

export interface ReportItem {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
  roomId: string;
  reason:
    | 'harassment_aac'
    | 'ableism'
    | 'speech_mockery'
    | 'disruption'
    | 'hate_speech'
    | 'other';
  description: string;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'resolved';
}

export const ROOM_CATEGORIES_INFO: Record<
  RoomCategory,
  { label: string; description: string; emoji: string }
> = {
  disability_community: {
    label: 'Disability Community',
    description: 'Inclusive community spaces for all people with disabilities and allies',
    emoji: '♿',
  },
  neurodivergent: {
    label: 'Neurodivergent Space',
    description: 'Autism, ADHD, sensory differences, low stimulation conversations',
    emoji: '🧠',
  },
  blind_low_vision: {
    label: 'Blind & Low Vision',
    description: 'Screen reader discussions, orientation & mobility, visual accessibility',
    emoji: '👁️',
  },
  deaf_hard_of_hearing: {
    label: 'Deaf & Hard of Hearing',
    description: 'Text-backed voice rooms with live captioning and visual alerts',
    emoji: '🦻',
  },
  speech_aac: {
    label: 'Speech & AAC Community',
    description: 'Rooms welcoming text-to-speech, non-speaking communicators, stuttering, and dysarthria',
    emoji: '💬',
  },
  mobility_wheelchair: {
    label: 'Mobility & Physical Disabilities',
    description: 'Switch access, adaptive technology, independent living, mobility aids',
    emoji: '🦼',
  },
  caregivers: {
    label: 'Caregiver & Ally Network',
    description: 'Caregiver support, shared resources, mutual aid and community connection',
    emoji: '🤝',
  },
  inclusive_education: {
    label: 'Inclusive Education',
    description: 'Accessible learning, academic accommodations, inclusive pedagogy',
    emoji: '📚',
  },
  accessible_employment: {
    label: 'Accessible Employment',
    description: 'Workplace accommodations, accessible tech careers, disability leadership',
    emoji: '💼',
  },
  disability_rights: {
    label: 'Disability Rights & Advocacy',
    description: 'Legal rights, UN CRPD, global advocacy, policy, systemic accessibility',
    emoji: '⚖️',
  },
  general: {
    label: 'Open Community',
    description: 'Welcoming open audio conversations for everyone',
    emoji: '🌍',
  },
};
