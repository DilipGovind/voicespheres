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
      title: 'Register Completely Free',
      desc: 'Create your account in seconds with zero fees, zero ads, and zero tracking. Or explore immediately as an anonymous guest.',
      actionText: 'Register Free',
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
    <section aria-labelledby="how-it-works-heading" className="space-y-6 pt-6 border-t border-white/[0.08]">
      <div>
        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
          Simple & Barrier-Free
        </span>
        <h2 id="how-it-works-heading" className="text-xl sm:text-2xl font-black text-white mt-2">
          How VoiceSphere Works in 3 Intuitive Steps
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Zero complex setups or proprietary software. Open any room right inside your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((st, i) => (
          <div
            key={i}
            className="glass-card rounded-3xl p-6.5 flex flex-col justify-between space-y-5 border border-white/[0.09] hover:border-white/20"
          >
            <div className="space-y-3">
              <span className="inline-block font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
                {st.num}
              </span>
              <h3 className="font-extrabold text-lg text-white">
                {st.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {st.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={st.onClick}
              className="btn-glass inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.01]"
            >
              <span>{st.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
