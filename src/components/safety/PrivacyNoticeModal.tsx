'use client';

import React from 'react';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { ShieldCheck, Lock, MicOff, Database, EyeOff, X } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyNoticeModal({ isOpen, onClose }: PrivacyNoticeModalProps) {
  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-notice-title"
        className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl rounded-3xl p-4 sm:p-8 space-y-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close privacy notice"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="flex items-center space-x-2 text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
            <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40">
              Privacy by Design
            </span>
          </div>
          <h2 id="privacy-notice-title" className="text-2xl font-black text-white">
            Prototype Privacy Notice
          </h2>
          <p className="text-xs text-zinc-400">
            Transparent disclosure of how this worldwide voice prototype handles your data.
          </p>
        </div>

        {/* Core Principles */}
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
          <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-start space-x-3.5">
            <MicOff className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">No Audio Recording by Default</h3>
              <p className="text-zinc-400 text-xs">
                Microphone audio is transmitted in real time via encrypted WebRTC (Opus codec) directly through the LiveKit SFU or peer mesh. Voice streams are ephemeral and processed in volatile RAM. No audio files are recorded or persisted to disk.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-start space-x-3.5">
            <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">What Data Is Stored</h3>
              <p className="text-zinc-400 text-xs">
                Only ephemeral room metadata (room title, topic, temporary participant nickname, speaking state, and optional demo captions) is held while a room is active. User profile preferences and accessibility presets are stored locally in your own browser's <code className="text-yellow-300">localStorage</code>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-start space-x-3.5">
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Short-Lived Ephemeral Tokens</h3>
              <p className="text-zinc-400 text-xs">
                Voice access is authorized via short-lived JWT tokens (15-minute validity) signed by the backend. No long-lived master credentials or API secret keys are ever exposed to the client or browser network logs.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-start space-x-3.5">
            <EyeOff className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Personal Blocking & Abuse Reporting</h3>
              <p className="text-zinc-400 text-xs">
                You can block any participant in a room at any time. Blocking immediately mutes their audio locally and suppresses their live captions and chat messages from your viewport.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
