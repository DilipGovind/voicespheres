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
  Volume2,
  VolumeX,
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
  isAudioBlocked?: boolean;
  isMonitoringSelf?: boolean;
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
  onUnlockAudio?: () => void;
  onToggleMicMonitoring?: () => void;
  onPlayTestChime?: () => void;
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
  isAudioBlocked,
  isMonitoringSelf,
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
  onUnlockAudio,
  onToggleMicMonitoring,
  onPlayTestChime,
  onLeaveRoom,
}: ControlsBarProps) {
  const { settings, announce } = useAccessibility();
  const { t } = useI18n();

  return (
    <nav
      role="toolbar"
      aria-label="Room Controls Toolbar"
      className="sticky bottom-0 z-30 w-full p-2.5 sm:p-4 pointer-events-none"
    >
      <div className="glass-dock max-w-5xl mx-auto rounded-3xl p-2.5 sm:px-5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 pointer-events-auto border border-white/10 shadow-2xl">
        {/* Left: Audio & Voice Controls */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
          {/* Mic Toggle (Only if speaker or host) */}
          {isSpeaker && (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex items-center space-x-2 rtl:space-x-reverse px-4.5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isMuted
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400/50 shadow-red-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border border-emerald-300/60 shadow-emerald-500/30'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
              <span>{isMuted ? 'Muted' : 'Speaking'}</span>
            </button>
          )}

          {/* Audio Unblock Trigger if browser blocked autoplay */}
          {isAudioBlocked && onUnlockAudio && (
            <button
              type="button"
              onClick={onUnlockAudio}
              aria-label="Browser paused audio. Click to unmute room sound."
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-400 text-black font-black text-xs shadow-lg animate-pulse border-2 border-amber-300 hover:bg-amber-300 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>Enable Audio</span>
            </button>
          )}

          {/* Mic Loopback Monitor ("Hear Myself") */}
          {isSpeaker && onToggleMicMonitoring && (
            <button
              type="button"
              onClick={onToggleMicMonitoring}
              aria-label={
                isMonitoringSelf
                  ? 'Turn off mic monitor loopback'
                  : 'Turn on mic monitor loopback to hear yourself'
              }
              title={
                isMonitoringSelf
                  ? 'Mic Monitor Active: You are hearing yourself'
                  : 'Mic Check: Hear your own voice in headphones'
              }
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full font-bold text-xs border transition-all ${
                isMonitoringSelf
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400/40'
                  : 'btn-glass text-zinc-300'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isMonitoringSelf ? 'Monitoring' : 'Hear Myself'}</span>
            </button>
          )}

          {/* Raise Hand Toggle */}
          <button
            type="button"
            onClick={onToggleHand}
            aria-label={isHandRaised ? 'Lower hand' : 'Raise hand to speak'}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm border transition-all ${
              isHandRaised
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-black border-amber-300 shadow-lg shadow-amber-400/25 ring-2 ring-amber-400/30'
                : 'btn-glass text-zinc-200'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline">{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>

          {/* AAC Toolkit Trigger */}
          <button
            type="button"
            onClick={onToggleAAC}
            aria-label="Open AAC Augmentative Communication and Type-to-Speak toolkit"
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm border transition-all ${
              aacOpen
                ? 'bg-emerald-400 text-black border-emerald-300 shadow-lg'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
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
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-full font-bold text-xs sm:text-sm border transition-all ${
              captionsOpen
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-md shadow-cyan-500/20'
                : 'btn-glass text-zinc-300'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span className="hidden md:inline">Captions</span>
          </button>

          {/* Text Chat Toggle */}
          <button
            type="button"
            onClick={onToggleChat}
            aria-label={chatOpen ? 'Hide text chat' : 'Show text chat'}
            aria-pressed={chatOpen}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 rounded-full font-bold text-xs sm:text-sm border transition-all ${
              chatOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                : 'btn-glass text-zinc-300'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
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
                  : 'Enable optional AI Voice Companion'
              }
              title={
                isAiEnabled
                  ? 'AI Voice Companion Active'
                  : 'Optional AI Voice Companion (Disabled by default)'
              }
              className={`p-2.5 rounded-full border transition-all ${
                isAiEnabled
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'btn-glass text-purple-300'
              }`}
            >
              <Bot className="w-4 h-4" />
            </button>
          )}

          {/* Community Feedback Button */}
          {onOpenFeedback && (
            <button
              type="button"
              onClick={onOpenFeedback}
              aria-label="Share Community Feedback"
              title="Share Feedback & Ideas"
              className="btn-glass p-2.5 rounded-full text-yellow-400"
            >
              <MessageSquareHeart className="w-4 h-4" />
            </button>
          )}

          {/* Host Controls Trigger (If Host) */}
          {isHost && onOpenHostControls && (
            <button
              type="button"
              onClick={onOpenHostControls}
              aria-label="Open Host Administration Controls"
              title="Room Host Controls"
              className="btn-glass p-2.5 rounded-full text-amber-400 border-amber-500/40"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Share Room Button */}
          {onShareRoom && (
            <button
              type="button"
              onClick={onShareRoom}
              aria-label="Share room invite link"
              className="btn-glass p-2.5 rounded-full text-zinc-300 hover:text-yellow-400"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Speaker / Audio Output Test Chime */}
          {onPlayTestChime && (
            <button
              type="button"
              onClick={onPlayTestChime}
              aria-label="Play test audio tone to verify speakers"
              title="Test Sound: Play 3-tone chime to test speakers"
              className="btn-glass p-2.5 rounded-full text-cyan-400 hover:text-cyan-300"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}

          {/* Accessibility Center Shortcut */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            aria-label="Open Universal Accessibility Center"
            className="p-2.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 transition-all"
          >
            <Sliders className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Report Abuse / Anti-Ableism */}
          <button
            type="button"
            onClick={onOpenReport}
            aria-label="Report harassment or ableist behavior"
            className="btn-glass p-2.5 rounded-full text-zinc-400 hover:text-red-400"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Leave Room Button */}
        <div>
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave this room"
            className="btn-danger-glass flex items-center space-x-2 rtl:space-x-reverse px-4.5 py-2.5 rounded-full font-bold text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
