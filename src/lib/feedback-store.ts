import { FeedbackItem, FeedbackInput } from '@/types/feedback';

export const INITIAL_COMMUNITY_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb_01',
    category: 'accessibility',
    rating: 5,
    title: 'AAC Symbol Board with Synthesizer is a Game Changer',
    message:
      'As a non-speaking creator, most audio apps exclude me completely. The combination of Type-to-Speak speech synthesis and visual symbol boards allows me to co-host rooms naturally at my own pace.',
    userName: 'Marcus C.',
    userHandle: 'marcus_aac',
    userRole: 'Community Member',
    activePreset: 'PRESET_C_AAC_NON_SPEAKING',
    createdAt: Date.now() - 3 * 86400000,
    helpfulCount: 24,
  },
  {
    id: 'fb_02',
    category: 'accessibility',
    rating: 5,
    title: 'Screen Reader Live Region works flawlessly with NVDA',
    message:
      'Tested with NVDA and VoiceOver. Announcements for hands raised, speaker turns, and stage state transitions are concise without drowning out the room audio. Outstanding WCAG compliance.',
    userName: 'Elena R.',
    userHandle: 'elena_a11y',
    userRole: 'A11Y Reviewer',
    activePreset: 'PRESET_A_BLIND_SCREEN_READER',
    createdAt: Date.now() - 5 * 86400000,
    helpfulCount: 31,
  },
  {
    id: 'fb_03',
    category: 'audio_quality',
    rating: 5,
    title: 'Low Latency & Crystal Clear Spatial Audio',
    message:
      'The WebRTC audio latency is virtually zero compared to other voice spaces. The individual volume control sliders per speaker are immensely helpful when listeners have varying hearing sensitivities.',
    userName: 'Jordan Smith',
    userHandle: 'jordan_audio',
    userRole: 'Sound Designer',
    activePreset: 'DEFAULT',
    createdAt: Date.now() - 2 * 86400000,
    helpfulCount: 18,
  },
  {
    id: 'fb_04',
    category: 'languages',
    rating: 5,
    title: 'RTL Support and Global Indian Language Coverage',
    message:
      'Very impressed with the Arabic and Urdu right-to-left layout integration, along with Hindi, Telugu, and Tamil support. Hosting cross-border accessibility roundtables has never felt smoother.',
    userName: 'Amina Al-Mansoor',
    userHandle: 'amina_voice',
    userRole: 'Moderator',
    activePreset: 'DEFAULT',
    createdAt: Date.now() - 6 * 86400000,
    helpfulCount: 22,
  },
  {
    id: 'fb_05',
    category: 'general',
    rating: 5,
    title: 'Sensory-Friendly Mode eliminates overwhelm',
    message:
      'The Low Stimulation preset removes flashing animations, mutes background noise cues, and keeps things calm. It makes attending community meetups restful rather than draining.',
    userName: 'David Miller',
    userHandle: 'david_sensory',
    userRole: 'Community Member',
    activePreset: 'PRESET_E_SENSORY_LOW_STIM',
    createdAt: Date.now() - 1 * 86400000,
    helpfulCount: 15,
  },
  {
    id: 'fb_06',
    category: 'feature_request',
    rating: 4,
    title: 'Would love customizable AAC symbol collections',
    message:
      'The default core symbols are fantastic. A feature to upload personal SVG pictogram sets or import PECS symbols would take this to the next level for specialized schools.',
    userName: 'Dr. Priya Sharma',
    userHandle: 'priya_sharma',
    userRole: 'EdTech Researcher',
    activePreset: 'PRESET_D_DYSLEXIA_FRIENDLY',
    createdAt: Date.now() - 4 * 86400000,
    helpfulCount: 29,
  },
];

const FEEDBACK_STORAGE_KEY = 'voicesphere_community_feedback';

const memoryFeedbackList: FeedbackItem[] = [...INITIAL_COMMUNITY_FEEDBACK];

/**
 * Get all community feedback items.
 */
export function getStoredFeedback(): FeedbackItem[] {
  if (typeof window === 'undefined') {
    return memoryFeedbackList;
  }

  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(INITIAL_COMMUNITY_FEEDBACK));
      return INITIAL_COMMUNITY_FEEDBACK;
    }
    const parsed: FeedbackItem[] = JSON.parse(raw);
    const idMap = new Map<string, FeedbackItem>();
    INITIAL_COMMUNITY_FEEDBACK.forEach((item) => idMap.set(item.id, item));
    parsed.forEach((item) => idMap.set(item.id, item));
    return Array.from(idMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return memoryFeedbackList;
  }
}

/**
 * Submit valuable user feedback.
 */
export function submitNewFeedback(input: FeedbackInput): {
  success: boolean;
  item?: FeedbackItem;
  error?: string;
} {
  if (!input.title?.trim() || !input.message?.trim()) {
    return { success: false, error: 'Please provide both a title and feedback description.' };
  }

  if (input.message.trim().length < 10) {
    return { success: false, error: 'Please provide at least 10 characters of detailed feedback.' };
  }

  const newItem: FeedbackItem = {
    id: 'fb_' + Math.random().toString(36).substring(2, 9),
    category: input.category || 'general',
    rating: Math.min(5, Math.max(1, input.rating || 5)),
    title: input.title.trim(),
    message: input.message.trim(),
    userName: input.userName?.trim() || 'Community Contributor',
    userEmail: input.userEmail?.trim() || undefined,
    activePreset: input.includeSystemInfo ? input.activePreset : undefined,
    createdAt: Date.now(),
    helpfulCount: 0,
  };

  const current = getStoredFeedback();
  const updated = [newItem, ...current];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  } else {
    memoryFeedbackList.unshift(newItem);
  }

  return { success: true, item: newItem };
}

/**
 * Increment helpful reaction counter.
 */
export function toggleHelpfulReaction(id: string): FeedbackItem[] {
  const current = getStoredFeedback();
  const updated = current.map((item) =>
    item.id === id ? { ...item, helpfulCount: item.helpfulCount + 1 } : item
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}
