'use client';

import React from 'react';
import {
  Volume2,
  Subtitles,
  MessageSquare,
  Sliders,
  ShieldCheck,
  MousePointer,
  Heart,
  Globe,
  Radio,
  Lock,
} from 'lucide-react';

export function PlatformFeatures() {
  const features = [
    {
      icon: Volume2,
      iconColor: 'text-blue-400',
      badge: 'Spatial Audio',
      title: 'Low-Latency Live Voice Stages',
      description:
        'Peer-to-peer WebRTC audio stages with real-time speaker queues, hand-raising, granular per-user volume control (up to 200%), and automatic acoustic echo cancellation.',
    },
    {
      icon: MessageSquare,
      iconColor: 'text-purple-400',
      badge: 'Non-Speaking Voice',
      title: 'AAC & Visual Symbol Toolkit',
      description:
        'A comprehensive Augmentative and Alternative Communication suite. Type-to-speak synthesizer, instant emoji & pictorial symbol boards, and custom phrase books for non-speaking users.',
    },
    {
      icon: Subtitles,
      iconColor: 'text-yellow-400',
      badge: 'Real-Time Text',
      title: 'Privacy-First Live Captions',
      description:
        'Assistive real-time speech captions right on your screen. Complete transcript downloads are cryptographically guarded: all room participants must provide mutual consent.',
    },
    {
      icon: MousePointer,
      iconColor: 'text-emerald-400',
      badge: 'Motor & Switch Access',
      title: 'Single-Switch & Auto-Scan Navigation',
      description:
        'Navigate the entire platform using a single switch, spacebar, or dwell clicking. Built with strict WCAG 2.2 AAA keyboard traps, high contrast, and zero flikering motion.',
    },
  ];

  return (
    <section aria-labelledby="features-heading" className="space-y-6 pt-4 border-t border-zinc-800">
      <div className="max-w-2xl">
        <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
          Accessibility as Architecture
        </span>
        <h2 id="features-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
          Built From Day One For Complete Cognitive & Physical Inclusion
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Every tool, control, and protocol is engineered to dismantle barriers in modern social audio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 hover:bg-zinc-900 hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-2xl bg-zinc-800 border border-zinc-700/60 ${feat.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {feat.badge}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-white">
                {feat.title}
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
