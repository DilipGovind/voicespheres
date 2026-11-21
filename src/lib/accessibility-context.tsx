'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AccessibilitySettings,
  AccessibilityPreset,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  PRESET_CONFIGURATIONS,
} from '@/types/accessibility';

interface AnnouncementQueueItem {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  applyPreset: (preset: AccessibilityPreset) => void;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetDefaults: () => void;
  announcements: AnnouncementQueueItem[];
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
  isSwitchScanActive: boolean;
  setIsSwitchScanActive: (active: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [announcements, setAnnouncements] = useState<AnnouncementQueueItem[]>([]);
  const [isSwitchScanActive, setIsSwitchScanActive] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicesphere_a11y');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync to localStorage
  const persistSettings = (newSettings: AccessibilitySettings) => {
    try {
      localStorage.setItem('voicesphere_a11y', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const applyPreset = useCallback((preset: AccessibilityPreset) => {
    setSettings((prev) => {
      if (preset === 'CUSTOM') {
        const updated: AccessibilitySettings = {
          ...prev,
          preset: 'CUSTOM',
        };
        persistSettings(updated);
        return updated;
      }
      const presetOverrides = PRESET_CONFIGURATIONS[preset] || {};
      const updated: AccessibilitySettings = {
        ...DEFAULT_ACCESSIBILITY_SETTINGS,
        ...presetOverrides,
        preset,
      };
      persistSettings(updated);
      return updated;
    });

    const nextConfig = PRESET_CONFIGURATIONS[preset];
    if (!nextConfig?.switchAccessEnabled) {
      setIsSwitchScanActive(false);
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          [key]: value,
          preset: 'CUSTOM' as AccessibilityPreset,
        };
        persistSettings(updated);
        return updated;
      });
    },
    []
  );

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    persistSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
  }, []);

  // Screen Reader Announcer
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!settings.screenReaderAnnouncements) return;
      const newItem: AnnouncementQueueItem = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        priority,
      };
      setAnnouncements((prev) => [...prev.slice(-4), newItem]);
    },
    [settings.screenReaderAnnouncements]
  );

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  // Apply visual accessibility CSS classes to document.body & documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // Reset accessibility classes
    const classesToRemove = [
      'dark',
      'light',
      'theme-high-contrast-dark',
      'theme-high-contrast-light',
      'theme-dyslexic-cream',
      'font-dyslexic',
      'text-scale-normal',
      'text-scale-large',
      'text-scale-extra-large',
      'text-scale-huge',
      'leading-relaxed',
      'leading-double',
      'tracking-wide',
      'high-focus-visible',
      'large-targets',
      'reduced-motion',
      'low-stimulation',
    ];
    root.classList.remove(...classesToRemove);
    body.classList.remove(...classesToRemove);

    // Apply theme
    if (settings.theme === 'high-contrast-dark') {
      root.classList.add('dark', 'theme-high-contrast-dark');
    } else if (settings.theme === 'high-contrast-light') {
      root.classList.add('light', 'theme-high-contrast-light');
    } else if (settings.theme === 'dyslexic-cream') {
      root.classList.add('theme-dyslexic-cream');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    // Apply font size
    root.classList.add(`text-scale-${settings.fontSize}`);

    // Font family
    if (settings.fontDyslexic) {
      root.classList.add('font-dyslexic');
    }

    // Line spacing
    if (settings.lineSpacing === 'relaxed') {
      root.classList.add('leading-relaxed');
    } else if (settings.lineSpacing === 'double') {
      root.classList.add('leading-double');
    }

    // Letter spacing
    if (settings.letterSpacingWide) {
      root.classList.add('tracking-wide');
    }

    // Focus rings
    if (settings.highFocusVisible) {
      root.classList.add('high-focus-visible');
    }

    // Large targets
    if (settings.largeTouchTargets) {
      root.classList.add('large-targets');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    }

    // Low stimulation
    if (settings.lowStimulationMode) {
      root.classList.add('low-stimulation');
    }
  }, [settings]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        applyPreset,
        updateSetting,
        resetDefaults,
        announcements,
        announce,
        clearAnnouncements,
        isSwitchScanActive,
        setIsSwitchScanActive,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
