'use client';

import React from 'react';
import { Sliders, UserPlus, Radio, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function HowItWorks({ onOpenAccessibility }: { onOpenAccessibility: () => void }) {
  const { openAuthModal } = useAuth();

  const steps = [
    {
      num: '01',
      title: 'Pick an Accessibility Preset',
      desc: 'One click optimizes high contrast, large typography, screen reader verbosity, dyslexia ruler, or sensory pacing.',
      actionText: 'Browse Presets',
      onClick: onOpenAccessibility,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300',
    },
    {
      num: '02',
      title: 'Sign In or Join as Guest',
      desc: 'Register in seconds to unlock +100 bonus coins & custom phrase books, or explore instantly with pseudonymous identity.',
      actionText: 'Register / Login',
      onClick: () => openAuthModal('register'),
      color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-300',
    },
    {
      num: '03',
      title: 'Participate On Your Terms',
      desc: 'Speak using your voice, type to synthesize computer audio, use symbol buttons, or listen with live real-time speech captions.',
      actionText: 'Find a Live Room',
      onClick: () => {
        const el = document.getElementById('discovery-heading');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    },
  ];

  return (
    <section aria-labelledby="how-it-works-heading" className="space-y-6 pt-4 border-t border-zinc-800">
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
          Simple & Barrier-Free
        </span>
        <h2 id="how-it-works-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
          How VoiceSphere Works
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Zero complex setups or proprietary software. Open any room right inside your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((st, i) => (
          <div
            key={i}
            className={`rounded-3xl border p-6 bg-gradient-to-br ${st.color} flex flex-col justify-between space-y-4`}
          >
            <div className="space-y-2">
              <span className="font-mono text-3xl font-black opacity-60">
                {st.num}
              </span>
              <h3 className="font-black text-lg text-white">
                {st.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {st.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={st.onClick}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white hover:underline pt-2"
            >
              <span>{st.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
