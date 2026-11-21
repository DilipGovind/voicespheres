'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Radio, ShieldCheck, Heart, Github, Award, Smartphone } from 'lucide-react';

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
    <footer className="w-full border-t border-white/[0.08] bg-zinc-950/90 backdrop-blur-xl py-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-zinc-400">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-white/10">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-tight">VoiceSphere 2.0</div>
            <p className="text-[11px] text-zinc-400">
              Free, Open-Source & Privacy-First Global Audio Community
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-300">
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Tracking & No Audio Sale</span>
          </span>

          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>WCAG 2.2 AAA Compliant</span>
          </span>

          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px]">
            AGPL-3.0 Open Architecture
          </span>

          <a
            href="/voicesphere.apk"
            download="voicesphere.apk"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold transition hover:scale-105"
            title="Download VoiceSphere Android App APK directly"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android APK</span>
          </a>

          <a
            href="/voicesphere.aab"
            download="voicesphere.aab"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold transition hover:scale-105"
            title="Download Google Play App Bundle (AAB)"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Play AAB</span>
          </a>
        </div>

        <div className="text-zinc-400 text-center md:text-right max-w-xs font-normal text-[11px] leading-relaxed">
          "Every person deserves a voice, whether expressed through speech, text, technology, or assistive communication."
        </div>
      </div>
    </footer>
  );
}
