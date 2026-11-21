'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import {
  Mic,
  MicOff,
  Hand,
  MessageSquare,
  Subtitles,
  MessageCircle,
  Sliders,
  LogOut,
  ShieldAlert,
  Share2,
  ShieldCheck,
  Bot,
  MessageSquareHeart,
} from 'lucide-react';

interface ControlsBarProps {
  isMuted: boolean;
  isHandRaised: boolean;
  captionsOpen: boolean;
  chatOpen: boolean;
  aacOpen: boolean;
  isSpeaker: boolean;
  isHost?: boolean;
  isAiEnabled?: boolean;
  onToggleMute: () => void;
  onToggleHand: () => void;
  onToggleCaptions: () => void;
  onToggleChat: () => void;
  onToggleAAC: () => void;
  onOpenAccessibility: () => void;
  onOpenReport: () => void;
  onOpenHostControls?: () => void;
  onToggleAiCompanion?: () => void;
  onOpenFeedback?: () => void;
  onShareRoom?: () => void;
  onLeaveRoom: () => void;
}

export function ControlsBar({
  isMuted,
  isHandRaised,
  captionsOpen,
  chatOpen,
  aacOpen,
  isSpeaker,
  isHost,
  isAiEnabled,
  onToggleMute,
  onToggleHand,
  onToggleCaptions,
  onToggleChat,
  onToggleAAC,
  onOpenAccessibility,
  onOpenReport,
  onOpenHostControls,
  onToggleAiCompanion,
  onOpenFeedback,
  onShareRoom,
  onLeaveRoom,
}: ControlsBarProps) {
  const { settings, announce } = useAccessibility();
  const { t } = useI18n();

  return (
    <nav
      role="toolbar"
      aria-label="Room Controls Toolbar"
      className="sticky bottom-0 z-30 w-full border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md py-3 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Audio & Voice Controls */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
          {/* Mic Toggle (Only if speaker or host) */}
          {isSpeaker && (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md transition ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
              <span>{isMuted ? 'Muted' : 'Speaking'}</span>
            </button>
          )}

          {/* Raise Hand Toggle */}
          <button
            type="button"
            onClick={onToggleHand}
            aria-label={isHandRaised ? 'Lower hand' : 'Raise hand to speak'}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-2xl font-bold text-sm border-2 transition ${
              isHandRaised
                ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span className="hidden sm:inline">{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>

          {/* AAC Toolkit Trigger */}
          <button
            type="button"
            onClick={onToggleAAC}
            aria-label="Open AAC Augmentative Communication and Type-to-Speak toolkit"
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-2xl font-bold text-sm border-2 transition ${
              aacOpen
                ? 'bg-emerald-500 text-black border-emerald-300'
                : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border-emerald-500/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">AAC Speak</span>
          </button>
        </div>

        {/* Center: Accessibility & Features */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
          {/* Captions Toggle */}
          <button
            type="button"
            onClick={onToggleCaptions}
            aria-label={captionsOpen ? 'Hide live captions' : 'Show live captions'}
            aria-pressed={captionsOpen}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-2xl font-bold text-sm border-2 transition ${
              captionsOpen
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <Subtitles className="w-5 h-5" />
            <span className="hidden md:inline">Captions</span>
          </button>

          {/* Text Chat Toggle */}
          <button
            type="button"
            onClick={onToggleChat}
            aria-label={chatOpen ? 'Hide text chat' : 'Show text chat'}
            aria-pressed={chatOpen}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-2xl font-bold text-sm border-2 transition ${
              chatOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden md:inline">Chat</span>
          </button>

          {/* Optional AI Voice Companion Toggle */}
          {onToggleAiCompanion && (
            <button
              type="button"
              onClick={onToggleAiCompanion}
              aria-label={
                isAiEnabled
                  ? 'Disable optional AI Voice Companion'
                  : 'Enable optional AI Voice Companion (Demo)'
              }
              title={
                isAiEnabled
                  ? 'AI Voice Companion Active (Demo)'
                  : 'Optional AI Voice Companion (Disabled by default)'
              }
              className={`p-2.5 rounded-2xl border-2 transition ${
                isAiEnabled
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-purple-400 border-zinc-700'
              }`}
            >
              <Bot className="w-5 h-5" />
            </button>
          )}

          {/* Community Feedback Button */}
          {onOpenFeedback && (
            <button
              type="button"
              onClick={onOpenFeedback}
              aria-label="Share Community Feedback"
              title="Share Feedback & Ideas"
              className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-zinc-700 hover:border-yellow-400/50 transition"
            >
              <MessageSquareHeart className="w-5 h-5" />
            </button>
          )}

          {/* Host Controls Trigger (If Host) */}
          {isHost && onOpenHostControls && (
            <button
              type="button"
              onClick={onOpenHostControls}
              aria-label="Open Host Administration Controls"
              title="Room Host Controls"
              className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-2 border-amber-500/50 transition"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}

          {/* Share Room Button */}
          {onShareRoom && (
            <button
              type="button"
              onClick={onShareRoom}
              aria-label="Share room invite link"
              className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-zinc-700 hover:border-yellow-400/50 transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          {/* Accessibility Center Shortcut */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            aria-label="Open Universal Accessibility Center"
            className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border-2 border-yellow-400/60 transition"
          >
            <Sliders className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Report Abuse / Anti-Ableism */}
          <button
            type="button"
            onClick={onOpenReport}
            aria-label="Report harassment or ableist behavior"
            className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-700 transition"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Leave Room Button */}
        <div>
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave this room"
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-red-950 text-zinc-300 hover:text-red-300 border-2 border-zinc-700 hover:border-red-500 font-bold text-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
