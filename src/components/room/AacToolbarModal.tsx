'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { AACSpeechEngine } from '@/lib/aac-speech-engine';
import {
  MANDATORY_AAC_PHRASES,
  SYMBOL_COMMUNICATION_CARDS,
  AACSymbolCard,
  AACCategory,
  AACCustomPhrase,
} from '@/types/aac';
import {
  MessageSquare,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Send,
  X,
  Play,
  Hand,
  Settings,
} from 'lucide-react';

interface AacToolbarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastAAC: (text: string, emoji?: string) => void;
  onRaiseHand?: () => void;
  isHandRaised?: boolean;
}

export function AacToolbarModal({
  isOpen,
  onClose,
  onBroadcastAAC,
  onRaiseHand,
  isHandRaised = false,
}: AacToolbarModalProps) {
  const { settings, announce } = useAccessibility();
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AACCategory>('core');
  const [customPhrases, setCustomPhrases] = useState<AACCustomPhrase[]>([]);
  const [newCustomPhrase, setNewCustomPhrase] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);

  // Load custom phrases from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicesphere_aac_custom');
      if (saved) {
        setCustomPhrases(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch speech synthesis voices
  useEffect(() => {
    const engine = AACSpeechEngine.getInstance();
    const available = engine.getVoices();
    setVoices(available);
    if (available.length > 0 && !selectedVoice) {
      setSelectedVoice(available[0].voiceURI);
    }
  }, [selectedVoice]);

  if (!isOpen) return null;

  const handleSpeakPhrase = (card: AACSymbolCard) => {
    announce(`Speaking AAC phrase: ${card.speechText}`, 'polite');
    const engine = AACSpeechEngine.getInstance();

    if (previewMode) {
      // Preview only (locally, don't broadcast)
      engine.speak(card.speechText, {
        voiceURI: selectedVoice,
        rate: settings.aacSpeed,
        pitch: settings.aacPitch,
      });
    } else {
      // Speak locally AND broadcast to room audio & captions
      engine.speak(card.speechText, {
        voiceURI: selectedVoice,
        rate: settings.aacSpeed,
        pitch: settings.aacPitch,
      });
      onBroadcastAAC(card.speechText, card.emoji);
    }
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    announce(`Broadcasting custom speech: ${text}`, 'polite');
    const engine = AACSpeechEngine.getInstance();

    if (previewMode) {
      engine.speak(text, {
        voiceURI: selectedVoice,
        rate: settings.aacSpeed,
        pitch: settings.aacPitch,
      });
    } else {
      engine.speak(text, {
        voiceURI: selectedVoice,
        rate: settings.aacSpeed,
        pitch: settings.aacPitch,
      });
      onBroadcastAAC(text, '💬');
      setInputText('');
    }
  };

  const handleSaveCustomPhrase = () => {
    if (!newCustomPhrase.trim()) return;
    const newPhrase: AACCustomPhrase = {
      id: Math.random().toString(36).substring(2, 9),
      text: newCustomPhrase.trim(),
      category: 'custom',
      createdAt: Date.now(),
    };
    const updated = [newPhrase, ...customPhrases];
    setCustomPhrases(updated);
    setNewCustomPhrase('');
    try {
      localStorage.setItem('voicesphere_aac_custom', JSON.stringify(updated));
    } catch {
      // ignore
    }
    announce(`Saved custom phrase: ${newPhrase.text}`, 'polite');
  };

  const handleDeleteCustomPhrase = (id: string) => {
    const updated = customPhrases.filter((p) => p.id !== id);
    setCustomPhrases(updated);
    try {
      localStorage.setItem('voicesphere_aac_custom', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const displayedSymbols =
    selectedCategory === 'core'
      ? MANDATORY_AAC_PHRASES
      : selectedCategory === 'custom'
      ? []
      : SYMBOL_COMMUNICATION_CARDS.filter((c) => c.category === selectedCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aac-toolkit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-emerald-400 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-emerald-500 text-black shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 id="aac-toolkit-title" className="text-xl md:text-2xl font-black text-white">
                  AAC & Non-Speaking Toolkit
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Speech Synthesizer Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Your synthesized voice will be broadcast live to all room participants
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {onRaiseHand && (
              <button
                type="button"
                onClick={onRaiseHand}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition ${
                  isHandRaised
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>{isHandRaised ? 'Hand Raised 🙋' : 'Raise Hand'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close AAC Toolkit"
              className="p-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Type-to-Speak Real-Time Input Bar */}
        <div className="p-4 bg-zinc-900/70 border-b border-zinc-800">
          <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type custom text to speak into the room..."
                aria-label="Type message to broadcast with synthesized voice"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border-2 border-zinc-700 text-white placeholder-zinc-500 font-medium focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                aria-label={previewMode ? 'Preview mode enabled (Local only)' : 'Broadcast mode (Live to room)'}
                className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center space-x-1.5 transition ${
                  previewMode
                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>{previewMode ? 'Preview (Solo)' : 'Live Broadcast'}</span>
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-sm flex items-center space-x-2 rtl:space-x-reverse shadow-lg shadow-emerald-500/25 transition"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Speak</span>
              </button>
            </div>
          </form>
        </div>

        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label="AAC Phrase Categories"
          className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-900/40 p-2 gap-2 scrollbar-thin"
        >
          {[
            { id: 'core', label: '10 Core Responses ⚡' },
            { id: 'reactions', label: 'Reactions & Feelings 😊' },
            { id: 'needs', label: 'Needs & Pacing ⏳' },
            { id: 'questions', label: 'Questions & Clarification ❓' },
            { id: 'flow', label: 'Conversation Flow 🔄' },
            { id: 'social', label: 'Social & Greetings 👋' },
            { id: 'custom', label: 'Saved Phrase Library 📁' },
          ].map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id as AACCategory)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-400 text-black shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Symbol Boards & Phrase Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {selectedCategory !== 'custom' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {displayedSymbols.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSpeakPhrase(card)}
                  type="button"
                  aria-label={`${card.label}. Speaks: "${card.speechText}"`}
                  className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 text-center transition-all hover:scale-105 active:scale-95 shadow-md ${card.colorClass}`}
                >
                  <span className="text-3xl sm:text-4xl mb-2 select-none" aria-hidden="true">
                    {card.emoji}
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-100 leading-tight">
                    {card.label}
                  </span>
                  {card.shortcut && (
                    <span className="mt-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-950/80 text-zinc-400 border border-zinc-700/60">
                      Key {card.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Custom Phrase Input */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCustomPhrase}
                  onChange={(e) => setNewCustomPhrase(e.target.value)}
                  placeholder="Create personal reusable phrase..."
                  aria-label="New custom phrase text"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-medium focus:border-emerald-400"
                />
                <button
                  onClick={handleSaveCustomPhrase}
                  disabled={!newCustomPhrase.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Phrase</span>
                </button>
              </div>

              {/* Saved Custom Phrases List */}
              {customPhrases.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-sm">
                  No custom phrases saved yet. Type a phrase above to add to your personal vocabulary.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customPhrases.map((phrase) => (
                    <div
                      key={phrase.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-700 bg-zinc-900/80 hover:border-emerald-400/50 transition"
                    >
                      <button
                        onClick={() => {
                          const engine = AACSpeechEngine.getInstance();
                          engine.speak(phrase.text, {
                            voiceURI: selectedVoice,
                            rate: settings.aacSpeed,
                            pitch: settings.aacPitch,
                          });
                          onBroadcastAAC(phrase.text, '💬');
                        }}
                        className="flex-1 text-left font-medium text-sm text-zinc-200 hover:text-emerald-300 pr-2"
                      >
                        "{phrase.text}"
                      </button>

                      <button
                        onClick={() => handleDeleteCustomPhrase(phrase.id)}
                        aria-label={`Delete phrase: ${phrase.text}`}
                        className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Voice Picker */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/90 text-xs text-zinc-400 gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-200 text-xs font-medium max-w-[200px] truncate"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-zinc-400">
            Synthesized speech is equal to natural voice. Anti-ableism rules strictly protect AAC users.
          </div>
        </div>
      </div>
    </div>
  );
}
