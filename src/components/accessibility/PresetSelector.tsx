'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { AccessibilityPreset } from '@/types/accessibility';
import {
  Eye,
  EyeOff,
  Ear,
  MessageSquare,
  MousePointer,
  Brain,
  Sparkles,
  VolumeX,
  BookOpen,
  Sliders,
  Check,
} from 'lucide-react';

interface PresetItem {
  id: AccessibilityPreset;
  title: string;
  letter: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
}

export const PRESET_LIST: PresetItem[] = [
  {
    id: 'BLIND',
    letter: 'A',
    title: 'Blind User Mode',
    description: 'Optimized for NVDA, JAWS, VoiceOver & TalkBack. High screen-reader verbosity, keyboard focus, and sound cues.',
    icon: <EyeOff className="w-6 h-6 text-yellow-400" />,
    tags: ['Screen Reader', 'Key Shortcuts', 'High Contrast'],
  },
  {
    id: 'LOW_VISION',
    letter: 'B',
    title: 'Low Vision Mode',
    description: 'Large scalable text (up to 200%), high-contrast dark theme, bold outlines, and large 56px interactive targets.',
    icon: <Eye className="w-6 h-6 text-amber-400" />,
    tags: ['200% Text', 'Yellow Contrast', 'Large Targets'],
  },
  {
    id: 'DEAF_HARD_OF_HEARING',
    letter: 'C',
    title: 'Deaf & Hard-of-Hearing Mode',
    description: 'Auto-activates real-time speech-to-text captions, visual voice ripple indicators, and visual-only alerts without sound dependencies.',
    icon: <Ear className="w-6 h-6 text-cyan-400" />,
    tags: ['Live Captions', 'Visual Alerts', 'Speech Indicators'],
  },
  {
    id: 'NON_SPEAKING_AAC',
    letter: 'D',
    title: 'Non-Speaking & AAC Mode',
    description: 'Integrated Augmentative Communication dock, Type-to-Speak synthesized speech into rooms, 10 quick response buttons & symbol boards.',
    icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
    tags: ['Type-to-Speak', 'AAC Symbol Board', '10 Quick Buttons'],
  },
  {
    id: 'LIMITED_MOBILITY',
    letter: 'E',
    title: 'Limited Mobility Mode',
    description: 'Single-switch scanning emulator, dwell-click support, zero drag-and-drop, large targets, and instant emergency exit.',
    icon: <MousePointer className="w-6 h-6 text-purple-400" />,
    tags: ['Switch Access', 'Dwell Click', 'Hands-Free'],
  },
  {
    id: 'COGNITIVE',
    letter: 'F',
    title: 'Cognitive Accessibility Mode',
    description: 'Easy Read simplified language mode, step-by-step room onboarding, contextual tooltips, and action confirmation prompts.',
    icon: <Brain className="w-6 h-6 text-blue-400" />,
    tags: ['Easy Read', 'Simple Language', 'Visual Guides'],
  },
  {
    id: 'NEURODIVERGENT',
    letter: 'G',
    title: 'Neurodivergent-Friendly Mode',
    description: 'Structured conversation mode (6-phase flow), clear speaking queue, speaking timers, and predictable navigation.',
    icon: <Sparkles className="w-6 h-6 text-violet-400" />,
    tags: ['Structured Stages', 'Speaking Queue', 'Predictable Flow'],
  },
  {
    id: 'LOW_STIMULATION',
    letter: 'H',
    title: 'Low-Stimulation Mode',
    description: 'Minimalist sensory-friendly interface. No flashing, reduced motion, quiet mode, and hidden participant counts to ease social anxiety.',
    icon: <VolumeX className="w-6 h-6 text-zinc-400" />,
    tags: ['Sensory Friendly', 'No Animations', 'Quiet Mode'],
  },
  {
    id: 'DYSLEXIA_FRIENDLY',
    letter: 'I',
    title: 'Dyslexia-Friendly Mode',
    description: 'Specialized dyslexia typography, increased line height (1.8x), wide letter spacing, and warm cream anti-glare background.',
    icon: <BookOpen className="w-6 h-6 text-amber-300" />,
    tags: ['Dyslexia Font', 'Cream Background', 'Wide Spacing'],
  },
  {
    id: 'CUSTOM',
    letter: 'J',
    title: 'Combined / Custom Mode',
    description: 'Freely combine and fine-tune any individual accessibility feature across visual, auditory, speech, motor, and cognitive needs.',
    icon: <Sliders className="w-6 h-6 text-teal-400" />,
    tags: ['Fully Configurable', 'Granular Toggles'],
  },
];

export function PresetSelector() {
  const { settings, applyPreset, announce } = useAccessibility();

  const handleSelect = (preset: AccessibilityPreset, title: string) => {
    applyPreset(preset);
    announce(`Activated accessibility preset: ${title}`, 'polite');
  };

  return (
    <div
      role="region"
      aria-label="One-Click Accessibility Presets"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4"
    >
      {PRESET_LIST.map((preset) => {
        const isSelected = settings.preset === preset.id;

        return (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id, preset.title)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`flex flex-col text-left p-5 rounded-2xl transition-all relative ${
              isSelected
                ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-500/15 via-zinc-900 to-zinc-950 shadow-xl shadow-yellow-500/10 ring-2 ring-yellow-400/40 scale-[1.01]'
                : 'glass-card border border-white/[0.08] hover:border-white/20 text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between w-full mb-2.5">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-white/10 shadow-sm">
                  {preset.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                      Preset {preset.letter}
                    </span>
                    <h3 className="font-extrabold text-base md:text-lg text-white">{preset.title}</h3>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div
                  aria-label="Currently active preset"
                  className="flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1 rounded-full bg-yellow-400 text-black font-black text-xs shadow-md"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Active</span>
                </div>
              )}
            </div>

            <p className="text-xs md:text-sm text-zinc-300 mb-3.5 leading-relaxed font-normal">
              {preset.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-auto">
              {preset.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
