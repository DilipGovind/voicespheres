export type AccessibilityPreset =
  | 'DEFAULT'
  | 'BLIND'
  | 'LOW_VISION'
  | 'DEAF_HARD_OF_HEARING'
  | 'NON_SPEAKING_AAC'
  | 'LIMITED_MOBILITY'
  | 'COGNITIVE'
  | 'NEURODIVERGENT'
  | 'LOW_STIMULATION'
  | 'DYSLEXIA_FRIENDLY'
  | 'CUSTOM';

export type AppTheme =
  | 'system'
  | 'light'
  | 'dark'
  | 'high-contrast-dark'
  | 'high-contrast-light'
  | 'dyslexic-cream';

export type FontSizeSetting = 'normal' | 'large' | 'extra-large' | 'huge'; // 100%, 125%, 150%, 200%
export type LineSpacingSetting = 'normal' | 'relaxed' | 'double';
export type CaptionFontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type CaptionContrast = 'standard' | 'high-black' | 'high-yellow';
export type SwitchMode = 'single' | 'two-switch';

export interface AnnouncementSettings {
  participants: boolean;
  speaking: boolean;
  moderation: boolean;
  messages: boolean;
  aac: boolean;
  connectionStatus: boolean;
}

export interface AccessibilitySettings {
  preset: AccessibilityPreset;

  // Visual
  theme: AppTheme;
  fontSize: FontSizeSetting;
  fontDyslexic: boolean;
  lineSpacing: LineSpacingSetting;
  letterSpacingWide: boolean;
  highFocusVisible: boolean;
  readingRuler: boolean;

  // Screen Reader
  screenReaderAnnouncements: boolean;
  announcementFilters: AnnouncementSettings;

  // Deaf / Hard of Hearing
  captionsEnabled: boolean;
  captionFontSize: CaptionFontSize;
  captionContrast: CaptionContrast;
  captionLanguage: string;
  audioVisualRipple: boolean;
  visualAlertsOnly: boolean;

  // Non-Speaking / AAC
  aacEnabled: boolean;
  aacVoice: string;
  aacSpeed: number; // 0.5 to 2.0
  aacPitch: number; // 0.5 to 1.5
  aacAutoBroadcast: boolean;
  dockAacToolbar: boolean;

  // Physical & Mobility
  switchAccessEnabled: boolean;
  switchScanInterval: number; // in milliseconds (e.g. 1500)
  switchMode: SwitchMode;
  dwellClickEnabled: boolean;
  dwellDelay: number; // in milliseconds (e.g. 1200)
  largeTouchTargets: boolean; // min 56px
  keyboardShortcutsEnabled: boolean;

  // Cognitive & Neurodivergent
  simpleLanguageMode: boolean; // Easy Read mode
  structuredConversationMode: boolean;
  reducedMotion: boolean;
  lowStimulationMode: boolean;
  hideParticipantCounts: boolean;
  quietMode: boolean;
  stepByStepOnboarding: boolean;
  requireActionConfirmation: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  preset: 'DEFAULT',
  theme: 'dark',
  fontSize: 'normal',
  fontDyslexic: false,
  lineSpacing: 'normal',
  letterSpacingWide: false,
  highFocusVisible: true,
  readingRuler: false,

  screenReaderAnnouncements: true,
  announcementFilters: {
    participants: true,
    speaking: true,
    moderation: true,
    messages: true,
    aac: true,
    connectionStatus: true,
  },

  captionsEnabled: false,
  captionFontSize: 'medium',
  captionContrast: 'high-black',
  captionLanguage: 'en',
  audioVisualRipple: true,
  visualAlertsOnly: false,

  aacEnabled: false,
  aacVoice: '',
  aacSpeed: 1.0,
  aacPitch: 1.0,
  aacAutoBroadcast: true,
  dockAacToolbar: false,

  switchAccessEnabled: false,
  switchScanInterval: 1800,
  switchMode: 'single',
  dwellClickEnabled: false,
  dwellDelay: 1200,
  largeTouchTargets: false,
  keyboardShortcutsEnabled: true,

  simpleLanguageMode: false,
  structuredConversationMode: false,
  reducedMotion: false,
  lowStimulationMode: false,
  hideParticipantCounts: false,
  quietMode: false,
  stepByStepOnboarding: true,
  requireActionConfirmation: true,
};

export const PRESET_CONFIGURATIONS: Record<
  AccessibilityPreset,
  Partial<AccessibilitySettings>
> = {
  DEFAULT: {
    preset: 'DEFAULT',
    theme: 'dark',
    fontSize: 'normal',
    fontDyslexic: false,
    lineSpacing: 'normal',
    letterSpacingWide: false,
    captionsEnabled: false,
    aacEnabled: false,
    switchAccessEnabled: false,
    simpleLanguageMode: false,
    lowStimulationMode: false,
    reducedMotion: false,
    largeTouchTargets: false,
  },
  BLIND: {
    preset: 'BLIND',
    theme: 'high-contrast-dark',
    highFocusVisible: true,
    screenReaderAnnouncements: true,
    announcementFilters: {
      participants: true,
      speaking: true,
      moderation: true,
      messages: true,
      aac: true,
      connectionStatus: true,
    },
    keyboardShortcutsEnabled: true,
    audioVisualRipple: false,
    reducedMotion: true,
    stepByStepOnboarding: true,
    requireActionConfirmation: true,
  },
  LOW_VISION: {
    preset: 'LOW_VISION',
    theme: 'high-contrast-dark',
    fontSize: 'huge', // 200%
    lineSpacing: 'relaxed',
    highFocusVisible: true,
    largeTouchTargets: true,
    captionsEnabled: true,
    captionFontSize: 'extra-large',
    captionContrast: 'high-yellow',
  },
  DEAF_HARD_OF_HEARING: {
    preset: 'DEAF_HARD_OF_HEARING',
    captionsEnabled: true,
    captionFontSize: 'large',
    captionContrast: 'high-yellow',
    audioVisualRipple: true,
    visualAlertsOnly: true,
    screenReaderAnnouncements: false,
  },
  NON_SPEAKING_AAC: {
    preset: 'NON_SPEAKING_AAC',
    aacEnabled: true,
    dockAacToolbar: true,
    aacAutoBroadcast: true,
    captionsEnabled: true,
    audioVisualRipple: true,
  },
  LIMITED_MOBILITY: {
    preset: 'LIMITED_MOBILITY',
    switchAccessEnabled: true,
    largeTouchTargets: true,
    keyboardShortcutsEnabled: true,
    dwellClickEnabled: false,
    switchScanInterval: 1800,
    reducedMotion: true,
  },
  COGNITIVE: {
    preset: 'COGNITIVE',
    simpleLanguageMode: true,
    fontSize: 'large',
    lineSpacing: 'relaxed',
    stepByStepOnboarding: true,
    requireActionConfirmation: true,
    lowStimulationMode: true,
    reducedMotion: true,
  },
  NEURODIVERGENT: {
    preset: 'NEURODIVERGENT',
    lowStimulationMode: true,
    reducedMotion: true,
    structuredConversationMode: true,
    quietMode: true,
    hideParticipantCounts: true,
    visualAlertsOnly: true,
  },
  LOW_STIMULATION: {
    preset: 'LOW_STIMULATION',
    theme: 'dark',
    lowStimulationMode: true,
    reducedMotion: true,
    audioVisualRipple: false,
    hideParticipantCounts: true,
    quietMode: true,
  },
  DYSLEXIA_FRIENDLY: {
    preset: 'DYSLEXIA_FRIENDLY',
    theme: 'dyslexic-cream',
    fontDyslexic: true,
    lineSpacing: 'double',
    letterSpacingWide: true,
    readingRuler: true,
    fontSize: 'large',
  },
  CUSTOM: {
    preset: 'CUSTOM',
  },
};
