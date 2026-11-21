'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  Radio,
  Sliders,
  UserPlus,
  LogIn,
  ShieldCheck,
  Volume2,
  Subtitles,
  MessageSquare,
  Globe,
  ArrowRight,
  Headphones,
  CheckCircle2,
  MessageSquareHeart,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenAccessibility: () => void;
  onCreateRoom: () => void;
  onOpenPrivacy: () => void;
  onOpenFeedback: () => void;
  totalActiveRooms: number;
}

export function HeroSection({
  onOpenAccessibility,
  onCreateRoom,
  onOpenPrivacy,
  onOpenFeedback,
  totalActiveRooms,
}: HeroSectionProps) {
  const { settings } = useAccessibility();
  const { t } = useI18n();
  const { user, openAuthModal } = useAuth();

  const scrollToRooms = () => {
    const el = document.getElementById('discovery-heading');
    if (el) {
      el.scrollIntoView({ behavior: settings.reducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-indigo-950/30 overflow-hidden backdrop-blur-2xl">
      {/* Background Ambient Mesh Glows */}
      <div
        className="absolute -top-36 -left-36 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/10 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-36 -right-36 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-yellow-400/15 via-violet-600/10 to-transparent blur-[110px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl space-y-7">
        {/* Top Badges & Live Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-400/15 to-amber-500/15 text-yellow-300 border border-yellow-400/30 text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>VoiceSphere 2.0 • Spatial Social Audio</span>
          </div>

          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{totalActiveRooms} Active Live Channels</span>
          </div>

          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>100% Free • WCAG 2.2 AAA</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
            Where Every Voice Belongs.{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
              3D Binaural Social Audio.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
            {t('appTagline')}. Connect and speak with crystal-clear 3D WebRTC audio, real-time captions, and synthesized AAC symbol speech. 100% free forever, zero tracking, completely open.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Primary Action: Discover Rooms */}
          <button
            type="button"
            onClick={scrollToRooms}
            className="btn-glow-primary flex items-center space-x-2.5 rtl:space-x-reverse h-12 px-6 rounded-2xl font-extrabold text-sm whitespace-nowrap shadow-xl"
          >
            <Radio className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>Explore Live Channels</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>

          {/* User Auth CTA */}
          {user ? (
            <button
              type="button"
              onClick={onCreateRoom}
              className="btn-glow-accent flex items-center space-x-2 rtl:space-x-reverse h-12 px-5 rounded-2xl font-black text-sm whitespace-nowrap"
            >
              <span>+ Start a Voice Space</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="btn-glow-accent flex items-center space-x-2 rtl:space-x-reverse h-12 px-5 rounded-2xl font-black text-sm whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              <span>Create Free Account</span>
            </button>
          )}

          {/* Accessibility Presets */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            className="btn-glass flex items-center space-x-2 rtl:space-x-reverse h-12 px-4.5 rounded-2xl font-bold text-sm text-yellow-300 border-yellow-400/30 hover:border-yellow-400/60 whitespace-nowrap"
          >
            <Sliders className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>{t('accessibilityPresets')}</span>
          </button>

          {/* Community Feedback Button */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="btn-glass flex items-center space-x-2 rtl:space-x-reverse h-12 px-4 rounded-2xl text-zinc-300 font-bold text-sm whitespace-nowrap"
          >
            <MessageSquareHeart className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>Community Notes</span>
          </button>
        </div>

        {/* Live Audio Equalizer & Feature Highlights Bar */}
        <div className="pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-3">
            {/* Animated Soundwave Visualizer */}
            <div className="flex items-center space-x-1 h-5" aria-hidden="true">
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
            </div>
            <span className="font-semibold text-zinc-200">
              3D HRTF Spatial Audio Engine Active
            </span>
          </div>

          <div className="flex items-center space-x-5">
            <span className="flex items-center space-x-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Speech Captions</span>
            </span>
            <span className="flex items-center space-x-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>AAC Symbol Synthesis</span>
            </span>
            <span className="flex items-center space-x-1.5 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>21 Global Languages</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
