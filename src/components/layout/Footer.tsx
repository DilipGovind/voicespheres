'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Radio, ShieldCheck, Heart, Github, Award } from 'lucide-react';

export function Footer() {
  const { settings } = useAccessibility();

  if (settings.lowStimulationMode) {
    return (
      <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-400">
        VoiceSphere – Free Open Source Accessible Audio Platform (AGPL-3.0). Privacy First.
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950/90 py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">VoiceSphere</div>
            <p className="text-[11px] text-zinc-400">
              Free, Open-Source & Privacy-First Global Audio Community
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-zinc-400">
          <span className="flex items-center space-x-1 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Tracking & No Audio Sale</span>
          </span>

          <span className="flex items-center space-x-1 text-yellow-400">
            <Award className="w-4 h-4" />
            <span>WCAG 2.2 AA / AAA Compliant</span>
          </span>

          <span>Licensed under AGPL-3.0</span>
        </div>

        <div className="text-zinc-400 text-center md:text-right">
          "Every person deserves a voice, whether expressed through speech, text, technology, or assistive communication."
        </div>
      </div>
    </footer>
  );
}
