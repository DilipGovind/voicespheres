export type AACCategory =
  | 'core'
  | 'needs'
  | 'reactions'
  | 'questions'
  | 'flow'
  | 'social'
  | 'custom';

export interface AACSymbolCard {
  id: string;
  label: string;
  speechText: string;
  category: AACCategory;
  emoji: string;
  colorClass: string;
  shortcut?: string;
}

export interface AACCustomPhrase {
  id: string;
  text: string;
  category: string;
  createdAt: number;
}

export const MANDATORY_AAC_PHRASES: AACSymbolCard[] = [
  {
    id: 'phrase_want_to_speak',
    label: 'I would like to speak',
    speechText: 'I would like to speak.',
    category: 'core',
    emoji: '🙋',
    colorClass: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    shortcut: '1',
  },
  {
    id: 'phrase_please_repeat',
    label: 'Please repeat',
    speechText: 'Please repeat that.',
    category: 'core',
    emoji: '🔄',
    colorClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    shortcut: '2',
  },
  {
    id: 'phrase_more_time',
    label: 'I need more time',
    speechText: 'I need a moment, please give me more time.',
    category: 'core',
    emoji: '⏳',
    colorClass: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    shortcut: '3',
  },
  {
    id: 'phrase_agree',
    label: 'I agree',
    speechText: 'I agree with this point.',
    category: 'core',
    emoji: '✅',
    colorClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    shortcut: '4',
  },
  {
    id: 'phrase_disagree',
    label: 'I disagree',
    speechText: 'I respectfully disagree.',
    category: 'core',
    emoji: '❌',
    colorClass: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    shortcut: '5',
  },
  {
    id: 'phrase_question',
    label: 'I have a question',
    speechText: 'I have a question for the room.',
    category: 'core',
    emoji: '❓',
    colorClass: 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    shortcut: '6',
  },
  {
    id: 'phrase_slow_down',
    label: 'Please slow down',
    speechText: 'Please slow down the pace of speaking.',
    category: 'core',
    emoji: '🐢',
    colorClass: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    shortcut: '7',
  },
  {
    id: 'phrase_assistance',
    label: 'I need assistance',
    speechText: 'I need assistance or technical help.',
    category: 'core',
    emoji: '🆘',
    colorClass: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400',
    shortcut: '8',
  },
  {
    id: 'phrase_cannot_speak',
    label: 'I cannot speak right now',
    speechText: 'I am unable to speak right now, I am using text and AAC.',
    category: 'core',
    emoji: '🔇',
    colorClass: 'border-slate-500 bg-slate-500/10 text-slate-600 dark:text-slate-400',
    shortcut: '9',
  },
  {
    id: 'phrase_thank_you',
    label: 'Thank you',
    speechText: 'Thank you very much.',
    category: 'core',
    emoji: '🙏',
    colorClass: 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400',
    shortcut: '0',
  },
];

export const SYMBOL_COMMUNICATION_CARDS: AACSymbolCard[] = [
  ...MANDATORY_AAC_PHRASES,
  // Reactions
  {
    id: 'sym_cheer',
    label: 'Celebrate / Bravo',
    speechText: 'That is wonderful, congratulations!',
    category: 'reactions',
    emoji: '🎉',
    colorClass: 'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'sym_clap',
    label: 'Applause / Clapping',
    speechText: 'Applause for this great point.',
    category: 'reactions',
    emoji: '👏',
    colorClass: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'sym_love',
    label: 'Heart / Warmth',
    speechText: 'I appreciate and love that.',
    category: 'reactions',
    emoji: '❤️',
    colorClass: 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  {
    id: 'sym_thinking',
    label: 'Thinking / Reflecting',
    speechText: 'I am thinking about what you just shared.',
    category: 'reactions',
    emoji: '🤔',
    colorClass: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },

  // Needs & Pacing
  {
    id: 'sym_break',
    label: 'Need a short break',
    speechText: 'I need to step away for a short sensory break.',
    category: 'needs',
    emoji: '☕',
    colorClass: 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    id: 'sym_clarify',
    label: 'Can you clarify?',
    speechText: 'Could you please explain that in simpler words?',
    category: 'needs',
    emoji: '💡',
    colorClass: 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'sym_mic_check',
    label: 'Can everyone hear me?',
    speechText: 'Can everyone hear my synthesized voice clearly?',
    category: 'needs',
    emoji: '🎤',
    colorClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },

  // Flow & Conversation
  {
    id: 'sym_add_point',
    label: 'Add to this topic',
    speechText: 'I have something to add to the current topic.',
    category: 'flow',
    emoji: '➕',
    colorClass: 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    id: 'sym_next_topic',
    label: 'Move to next topic',
    speechText: 'Are we ready to transition to the next topic?',
    category: 'flow',
    emoji: '⏭️',
    colorClass: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'sym_ready_closing',
    label: 'Ready for closing',
    speechText: 'I am ready for the closing remarks.',
    category: 'flow',
    emoji: '🏁',
    colorClass: 'border-slate-500 bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },

  // Social
  {
    id: 'sym_hello',
    label: 'Hello everyone',
    speechText: 'Hello everyone, I am happy to be here.',
    category: 'social',
    emoji: '👋',
    colorClass: 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400',
  },
  {
    id: 'sym_goodbye',
    label: 'Goodbye for now',
    speechText: 'Goodbye everyone, thank you for the wonderful discussion.',
    category: 'social',
    emoji: '🌟',
    colorClass: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];
