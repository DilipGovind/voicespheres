'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { Room, RoomCategory, ROOM_CATEGORIES_INFO } from '@/types/room';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/types/i18n';
import {
  X,
  PlusCircle,
  Subtitles,
  MessageSquare,
  Sparkles,
  Sliders,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newRoom: Room) => void;
  currentUserId: string;
  currentUserName: string;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
  currentUserId,
  currentUserName,
}: CreateRoomModalProps) {
  const { announce } = useAccessibility();
  const { locale } = useI18n();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoomCategory>('disability_community');
  const [language, setLanguage] = useState<SupportedLocale>(locale);
  const [country, setCountry] = useState('Global');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');

  // Accessibility feature flags
  const [captionsAvailable, setCaptionsAvailable] = useState(true);
  const [textParticipation, setTextParticipation] = useState(true);
  const [aacSupport, setAacSupport] = useState(true);
  const [lowStimulation, setLowStimulation] = useState(false);
  const [structuredDiscussion, setStructuredDiscussion] = useState(false);
  const [quietRoom, setQuietRoom] = useState(false);

  // Content warnings
  const [hasContentWarning, setHasContentWarning] = useState(false);
  const [warningDescription, setWarningDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRoom: Room = {
      id: 'room_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      topic: topic.trim() || 'Open Community Discussion',
      description: description.trim(),
      category,
      language,
      country,
      isPrivate,
      passcode: isPrivate ? passcode : undefined,
      hostId: currentUserId,
      createdAt: Date.now(),
      accessibilityFeatures: {
        captionsAvailable,
        textParticipation,
        aacSupport,
        lowStimulation,
        structuredDiscussion,
        listeningOnlyAllowed: true,
        screenReaderOptimized: true,
        quietRoom,
      },
      structuredStage: {
        currentStage: structuredDiscussion ? 'INTRO' : 'DISCUSSION',
        stageTitle: 'Discussion Stage',
        stageDescription: 'Community open floor',
        speakingTimeLimitSeconds: 120,
        activeSpeakerId: currentUserId,
        stageStartedAt: Date.now(),
        queue: [],
      },
      participants: [
        {
          id: currentUserId,
          name: currentUserName,
          avatar: currentUserName.slice(0, 2).toUpperCase(),
          role: 'host',
          isMuted: false,
          isSpeaking: false,
          isHandRaised: false,
          isAacUser: aacSupport,
          volume: 100,
          joinedAt: Date.now(),
        },
      ],
      contentWarning: hasContentWarning
        ? {
            enabled: true,
            tags: ['Sensitive Discussion'],
            description: warningDescription || 'Sensitive topics may be discussed.',
          }
        : undefined,
    };

    onCreate(newRoom);
    announce(`Created room: ${newRoom.name}`, 'polite');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-blue-500 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="create-room-title" className="text-xl font-black text-white">
                Create Inclusive Voice Room
              </h2>
              <p className="text-xs text-zinc-400">
                Design an accessible, welcoming space for global community participation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Room Title & Topic */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Room Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Accessible Tech Roundtable & AAC Hangout"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Topic & Conversation Focus
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What will this room discuss?"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Community Focus
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RoomCategory)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm"
              >
                {Object.entries(ROOM_CATEGORIES_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.emoji} {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm"
              >
                {Object.entries(SUPPORTED_LOCALES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.nativeName} ({info.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Accessibility Features */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Accessibility & Interaction Features
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center space-x-2.5 rtl:space-x-reverse p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captionsAvailable}
                  onChange={(e) => setCaptionsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <div>
                  <span className="text-xs font-bold block text-zinc-200">Live Captions Enabled</span>
                  <span className="text-[11px] text-zinc-400">Real-time speech-to-text</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 rtl:space-x-reverse p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aacSupport}
                  onChange={(e) => setAacSupport(e.target.checked)}
                  className="w-4 h-4 accent-emerald-400 rounded"
                />
                <div>
                  <span className="text-xs font-bold block text-zinc-200">AAC & Synthesized Speech</span>
                  <span className="text-[11px] text-zinc-400">Non-speaking welcome</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 rtl:space-x-reverse p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={structuredDiscussion}
                  onChange={(e) => setStructuredDiscussion(e.target.checked)}
                  className="w-4 h-4 accent-blue-400 rounded"
                />
                <div>
                  <span className="text-xs font-bold block text-zinc-200">Structured Flow Mode</span>
                  <span className="text-[11px] text-zinc-400">6-stage clear speaking queue</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 rtl:space-x-reverse p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStimulation}
                  onChange={(e) => setLowStimulation(e.target.checked)}
                  className="w-4 h-4 accent-purple-400 rounded"
                />
                <div>
                  <span className="text-xs font-bold block text-zinc-200">Low Stimulation Room</span>
                  <span className="text-[11px] text-zinc-400">Sensory friendly atmosphere</span>
                </div>
              </label>
            </div>
          </div>

          {/* Content Warning Notice Options */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <label className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={hasContentWarning}
                onChange={(e) => setHasContentWarning(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="text-xs font-bold text-zinc-200">
                Add Sensory / Content Warning for Sensitive Topics
              </span>
            </label>

            {hasContentWarning && (
              <textarea
                value={warningDescription}
                onChange={(e) => setWarningDescription(e.target.value)}
                placeholder="Explain the sensitive topic (e.g. mental health discussion, medical experiences)..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs placeholder-zinc-500"
              />
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition"
            >
              Launch Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
