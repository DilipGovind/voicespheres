import { describe, it, expect } from 'vitest';
import {
  PRESET_CONFIGURATIONS,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  AccessibilityPreset,
} from '../src/types/accessibility';

describe('Universal Accessibility Configuration', () => {
  it('defines all 10 mandatory presets A through J', () => {
    const expectedPresets: AccessibilityPreset[] = [
      'BLIND',
      'LOW_VISION',
      'DEAF_HARD_OF_HEARING',
      'NON_SPEAKING_AAC',
      'LIMITED_MOBILITY',
      'COGNITIVE',
      'NEURODIVERGENT',
      'LOW_STIMULATION',
      'DYSLEXIA_FRIENDLY',
      'CUSTOM',
    ];

    expectedPresets.forEach((preset) => {
      expect(PRESET_CONFIGURATIONS).toHaveProperty(preset);
    });
  });

  it('Blind user preset enforces high screen reader verbosity & contrast', () => {
    const blindPreset = PRESET_CONFIGURATIONS.BLIND;
    expect(blindPreset.screenReaderAnnouncements).toBe(true);
    expect(blindPreset.theme).toBe('high-contrast-dark');
    expect(blindPreset.keyboardShortcutsEnabled).toBe(true);
  });

  it('Low vision preset configures huge text scaling up to 200%', () => {
    const lowVision = PRESET_CONFIGURATIONS.LOW_VISION;
    expect(lowVision.fontSize).toBe('huge');
    expect(lowVision.highFocusVisible).toBe(true);
    expect(lowVision.largeTouchTargets).toBe(true);
  });

  it('Deaf & hard-of-hearing preset activates live captions & visual ripples', () => {
    const deafPreset = PRESET_CONFIGURATIONS.DEAF_HARD_OF_HEARING;
    expect(deafPreset.captionsEnabled).toBe(true);
    expect(deafPreset.audioVisualRipple).toBe(true);
    expect(deafPreset.visualAlertsOnly).toBe(true);
  });

  it('Non-speaking AAC preset docks communication board & enables TTS broadcast', () => {
    const aacPreset = PRESET_CONFIGURATIONS.NON_SPEAKING_AAC;
    expect(aacPreset.aacEnabled).toBe(true);
    expect(aacPreset.dockAacToolbar).toBe(true);
    expect(aacPreset.aacAutoBroadcast).toBe(true);
  });

  it('Limited mobility preset enables single-switch scanning & large targets', () => {
    const mobilityPreset = PRESET_CONFIGURATIONS.LIMITED_MOBILITY;
    expect(mobilityPreset.switchAccessEnabled).toBe(true);
    expect(mobilityPreset.largeTouchTargets).toBe(true);
  });

  it('Neurodivergent & Cognitive presets configure low stimulation & simple language', () => {
    expect(PRESET_CONFIGURATIONS.COGNITIVE.simpleLanguageMode).toBe(true);
    expect(PRESET_CONFIGURATIONS.NEURODIVERGENT.lowStimulationMode).toBe(true);
    expect(PRESET_CONFIGURATIONS.NEURODIVERGENT.structuredConversationMode).toBe(true);
  });

  it('Dyslexia preset configures specialized typeface & double line spacing', () => {
    const dyslexiaPreset = PRESET_CONFIGURATIONS.DYSLEXIA_FRIENDLY;
    expect(dyslexiaPreset.fontDyslexic).toBe(true);
    expect(dyslexiaPreset.lineSpacing).toBe('double');
    expect(dyslexiaPreset.letterSpacingWide).toBe(true);
  });

  it('Clean preset transitions do not leak switch access into cognitive mode', () => {
    // Simulating preset transition from LIMITED_MOBILITY to COGNITIVE over default base
    const mobilityApplied = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...PRESET_CONFIGURATIONS.LIMITED_MOBILITY,
      preset: 'LIMITED_MOBILITY' as const,
    };
    expect(mobilityApplied.switchAccessEnabled).toBe(true);

    const cognitiveApplied = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...PRESET_CONFIGURATIONS.COGNITIVE,
      preset: 'COGNITIVE' as const,
    };
    expect(cognitiveApplied.switchAccessEnabled).toBe(false);
    expect(cognitiveApplied.simpleLanguageMode).toBe(true);
  });

  it('Clean preset transitions do not leak dyslexia font into default mode', () => {
    const dyslexiaApplied = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...PRESET_CONFIGURATIONS.DYSLEXIA_FRIENDLY,
      preset: 'DYSLEXIA_FRIENDLY' as const,
    };
    expect(dyslexiaApplied.fontDyslexic).toBe(true);
    expect(dyslexiaApplied.theme).toBe('dyslexic-cream');

    const defaultApplied = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...PRESET_CONFIGURATIONS.DEFAULT,
      preset: 'DEFAULT' as const,
    };
    expect(defaultApplied.fontDyslexic).toBe(false);
    expect(defaultApplied.theme).toBe('dark');
  });
});
