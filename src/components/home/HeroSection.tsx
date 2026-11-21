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
  Coins,
  ShieldCheck,
  Volume2,
  Subtitles,
  MessageSquare,
  Globe,
  ArrowRight,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenAccessibility: () => void;
  onCreateRoom: () => void;
  onOpenPrivacy: () => void;
  totalActiveRooms: number;
}

export function HeroSection({
  onOpenAccessibility,
  onCreateRoom,
  onOpenPrivacy,
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
    <div className="relative rounded-3xl border-2 border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
      {/* Background Ambient Glows */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl space-y-6">
        {/* Top Badges & Live Status */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>VoiceSphere 2.0 • The Inclusive Audio Architecture</span>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{totalActiveRooms} Live Accessible Spaces</span>
          </div>

          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>WCAG 2.2 AAA Compliant</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Where Every Voice Belongs.{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-yellow-400">
              Truly Accessible Social Audio.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
            {t('appTagline')} Join live conversations using your microphone, live captions, typed text, or AAC synthesized speech. No downloads, zero tracking, completely open.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Primary Action: Discover Rooms */}
          <button
            type="button"
            onClick={scrollToRooms}
            className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <Radio className="w-4 h-4" />
            <span>Discover Active Rooms</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* User Auth CTA */}
          {user ? (
            <button
              type="button"
              onClick={onCreateRoom}
              className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm shadow-xl shadow-yellow-400/20 transition transform hover:-translate-y-0.5"
            >
              <span>{t('createRoom')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm shadow-xl shadow-yellow-400/20 transition transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account (+100 Coins)</span>
            </button>
          )}

          {/* 1-Click Demo Logins */}
          <button
            type="button"
            onClick={() => openAuthModal('demo')}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-3.5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-sm transition"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>1-Click Demo Personas</span>
          </button>

          {/* Accessibility Presets */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-yellow-300 border border-yellow-400/30 font-bold text-sm transition"
          >
            <Sliders className="w-4 h-4" />
            <span>{t('accessibilityPresets')}</span>
          </button>
        </div>

        {/* Live Audio Equalizer & Feature Highlights Bar */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-3">
            {/* Visual Equalizer */}
            <div className="flex items-center space-x-1 h-5" aria-hidden="true">
              <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
              <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s] h-5"></span>
              <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.4s] h-2"></span>
              <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.2s] h-4"></span>
              <span className="w-1 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.35s] h-3"></span>
            </div>
            <span className="font-semibold text-zinc-300">
              Low-Latency WebRTC Spatial Audio Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Speech Captions</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>AAC Symbol Synthesis</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
              <span>21 Global Languages</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
