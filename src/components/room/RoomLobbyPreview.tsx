'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Room } from '@/types/room';
import { AudioMeter } from '@/lib/audio-meter';
import { serializeRoomToUrl } from '@/lib/room-serializer';
import {
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Shield,
  Check,
  Subtitles,
  MessageSquare,
  Sparkles,
  ArrowRight,
  User,
  Share2,
  Copy,
} from 'lucide-react';

interface RoomLobbyPreviewProps {
  room: Room;
  onConfirmJoin: (options: { joinAsListener: boolean; displayName: string }) => void;
  onCancel: () => void;
}

export function RoomLobbyPreview({ room, onConfirmJoin, onCancel }: RoomLobbyPreviewProps) {
  const { settings, announce } = useAccessibility();
  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [joinAsListenerOnly, setJoinAsListenerOnly] = useState(false);
  const [displayName, setDisplayName] = useState('InclusiveVoice');
  const [contentWarningAccepted, setContentWarningAccepted] = useState(!room.contentWarning?.enabled);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = serializeRoomToUrl(room, window.location.origin);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      announce('Room invite link copied to clipboard.', 'polite');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    // Generate pseudonymous default name if saved
    try {
      const savedName = localStorage.getItem('voicesphere_username');
      if (savedName) setDisplayName(savedName);
    } catch {
      // ignore
    }
  }, []);

  const handleTestMic = async () => {
    if (micActive) {
      setMicActive(false);
      setAudioLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const meter = new AudioMeter();
      meter.attachStream(stream, (level) => {
        setAudioLevel(level);
      });
      setMicActive(true);
      announce('Microphone test active. Speak to test your audio meter.', 'polite');
    } catch (err) {
      announce('Could not access microphone. You can join as a listener or use AAC text speech.', 'assertive');
    }
  };

  const handleJoin = () => {
    if (room.contentWarning?.enabled && !contentWarningAccepted) {
      announce('Please review the content warning before joining.', 'assertive');
      return;
    }
    onConfirmJoin({ joinAsListener: joinAsListenerOnly, displayName });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lobby-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-6 sm:p-8 text-zinc-100 shadow-2xl space-y-6">
        {/* Header */}
        <div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
            Room Preview & Onboarding
          </span>
          <h2 id="lobby-title" className="text-2xl font-black text-white mt-2">
            {room.name}
          </h2>
          <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
            {room.topic}
          </p>
        </div>

        {/* Content Warning Notice */}
        {room.contentWarning?.enabled && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Sensory & Content Notice</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {room.contentWarning.description || 'This room may discuss sensitive topics. You can leave at any time.'}
            </p>
            <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={contentWarningAccepted}
                onChange={(e) => setContentWarningAccepted(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="font-semibold text-white">I have reviewed and acknowledge this notice</span>
            </label>
          </div>
        )}

        {/* Accessibility Badges Supported in this Room */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Room Inclusivity Features
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {room.accessibilityFeatures.captionsAvailable && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                <Subtitles className="w-3.5 h-3.5" />
                <span>Live Captions Active</span>
              </span>
            )}
            {room.accessibilityFeatures.aacSupport && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AAC Synthesized Voice Welcomed</span>
              </span>
            )}
            {room.accessibilityFeatures.lowStimulation && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Low Stimulation</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
              🌐 {room.language.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Display Name & Preferences */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Your Pseudonymous Display Name
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter screen name..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mic Check & Listener-Only Mode */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Microphone Sound Check</span>
                <span className="text-xs text-zinc-400">Optional: Test your mic volume before entering</span>
              </div>
              <button
                type="button"
                onClick={handleTestMic}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  micActive
                    ? 'bg-emerald-500 text-black border-emerald-400'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:text-white'
                }`}
              >
                {micActive ? 'Stop Mic Test' : 'Test Audio'}
              </button>
            </div>

            {micActive && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Input Level:</span>
                  <span className="font-mono font-bold text-emerald-400">{audioLevel}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-yellow-400 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}

            <label className="flex items-center space-x-2.5 rtl:space-x-reverse pt-2 border-t border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={joinAsListenerOnly}
                onChange={(e) => setJoinAsListenerOnly(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
              <span className="text-xs font-semibold text-zinc-200">
                Join as Listening-Only (Microphone will remain off)
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy room invite link"
              className="flex items-center space-x-1 px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-yellow-300 text-xs sm:text-sm font-semibold transition"
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={room.contentWarning?.enabled && !contentWarningAccepted}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <span>{settings.simpleLanguageMode ? 'Enter Room' : 'Join Voice Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
