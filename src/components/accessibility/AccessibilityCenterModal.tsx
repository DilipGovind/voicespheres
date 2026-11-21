'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { PresetSelector } from './PresetSelector';
import {
  X,
  Sliders,
  Eye,
  Ear,
  MessageSquare,
  MousePointer,
  Brain,
  RotateCcw,
  Save,
  Volume2,
} from 'lucide-react';

interface AccessibilityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'presets' | 'visual' | 'hearing' | 'aac' | 'mobility' | 'cognitive' | 'screenreader';

export function AccessibilityCenterModal({ isOpen, onClose }: AccessibilityCenterModalProps) {
  const { settings, updateSetting, resetDefaults, announce } = useAccessibility();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  const handleClose = () => {
    onClose();
    announce('Accessibility Center closed.', 'polite');
  };

  useModalDismiss(isOpen, handleClose);

  if (!isOpen) return null;

  const handleReset = () => {
    resetDefaults();
    announce('All accessibility settings have been reset to default values.', 'assertive');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-center-title"
        className="glass-panel relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 text-zinc-100 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-black shadow-md shadow-yellow-500/20">
              <Sliders className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="a11y-center-title" className="text-xl md:text-2xl font-black tracking-tight text-white">
                Universal Accessibility Center
              </h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Personalize your sensory, communication, cognitive, and mobility experience
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close Accessibility Center"
            className="p-2 rounded-2xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 focus:ring-4 focus:ring-yellow-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Accessibility setting categories"
          className="flex w-full max-w-full overflow-x-auto border-b border-zinc-800 bg-zinc-900/50 p-2 gap-1.5 scrollbar-thin"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'presets'}
            onClick={() => setActiveTab('presets')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'presets'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Presets (A-J)</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'visual'}
            onClick={() => setActiveTab('visual')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'visual'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Visual & Theme</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'hearing'}
            onClick={() => setActiveTab('hearing')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'hearing'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Ear className="w-4 h-4" />
            <span>Hearing & Captions</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'aac'}
            onClick={() => setActiveTab('aac')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'aac'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AAC & Speech</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'mobility'}
            onClick={() => setActiveTab('mobility')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'mobility'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>Mobility & Switch</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'cognitive'}
            onClick={() => setActiveTab('cognitive')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'cognitive'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Cognitive & Sensory</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'screenreader'}
            onClick={() => setActiveTab('screenreader')}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'screenreader'
                ? 'bg-yellow-400 text-black shadow'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Screen Reader</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'presets' && (
            <div>
              <div className="p-4 mb-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 text-zinc-300">
                <h3 className="font-bold text-yellow-400 text-sm md:text-base mb-1">
                  10 Universal Inclusivity Presets
                </h3>
                <p className="text-xs md:text-sm">
                  Select a mode tailored to your specific accessibility profile. Presets are starting points and can be fine-tuned at any time.
                </p>
              </div>
              <PresetSelector />
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-bold text-zinc-200 mb-2">
                  Theme & Contrast Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode (Default)' },
                    { id: 'light', label: 'Light Mode' },
                    { id: 'high-contrast-dark', label: 'High Contrast (Yellow / Black)' },
                    { id: 'high-contrast-light', label: 'High Contrast (Black / White)' },
                    { id: 'dyslexic-cream', label: 'Dyslexic Anti-Glare Cream' },
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      onClick={() => updateSetting('theme', themeOpt.id as any)}
                      className={`p-3 rounded-xl border text-sm font-semibold text-left transition ${
                        settings.theme === themeOpt.id
                          ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {themeOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Scaling */}
              <div>
                <label className="block text-sm font-bold text-zinc-200 mb-2">
                  Text Scaling (WCAG 2.2 AA/AAA)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'normal', label: '100% (Standard)' },
                    { id: 'large', label: '125% (Large)' },
                    { id: 'extra-large', label: '150% (Extra Large)' },
                    { id: 'huge', label: '200% (Maximum Scale)' },
                  ].map((sizeOpt) => (
                    <button
                      key={sizeOpt.id}
                      onClick={() => updateSetting('fontSize', sizeOpt.id as any)}
                      className={`p-3 rounded-xl border text-sm font-semibold text-center transition ${
                        settings.fontSize === sizeOpt.id
                          ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {sizeOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Toggles */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Dyslexia-Friendly Font</span>
                    <span className="text-xs text-zinc-400">
                      Applies OpenDyslexic / Lexend weighted letterforms to improve readability
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.fontDyslexic}
                    onChange={(e) => updateSetting('fontDyslexic', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">High-Visibility Keyboard Focus Outlines</span>
                    <span className="text-xs text-zinc-400">
                      Bold 4px high-contrast yellow outline around every focused element
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.highFocusVisible}
                    onChange={(e) => updateSetting('highFocusVisible', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Reading Guide Ruler</span>
                    <span className="text-xs text-zinc-400">
                      Displays a horizontal highlighted guide line to help follow text
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.readingRuler}
                    onChange={(e) => updateSetting('readingRuler', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'hearing' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-bold text-base block text-white">
                    Live Real-Time Speech Captions
                  </span>
                  <span className="text-xs text-zinc-400">
                    Transcribes live voices and synthesized speech in the room with speaker identification
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.captionsEnabled}
                  onChange={(e) => updateSetting('captionsEnabled', e.target.checked)}
                  className="w-6 h-6 accent-yellow-400 rounded cursor-pointer"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Caption Font Size
                  </label>
                  <select
                    value={settings.captionFontSize}
                    onChange={(e) => updateSetting('captionFontSize', e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium"
                  >
                    <option value="small">Small (16px)</option>
                    <option value="medium">Medium (20px)</option>
                    <option value="large">Large (26px)</option>
                    <option value="extra-large">Extra Large (32px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Caption Background Contrast
                  </label>
                  <select
                    value={settings.captionContrast}
                    onChange={(e) => updateSetting('captionContrast', e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium"
                  >
                    <option value="high-black">High Contrast Black (White Text)</option>
                    <option value="high-yellow">High Contrast Black (Yellow Text)</option>
                    <option value="standard">Translucent Glass</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Visual Voice Ripples (VAD)</span>
                    <span className="text-xs text-zinc-400">
                      Pulsing visual halos around speakers so deaf users can immediately identify who is speaking
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.audioVisualRipple}
                    onChange={(e) => updateSetting('audioVisualRipple', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Visual Alerts Only</span>
                    <span className="text-xs text-zinc-400">
                      Disables audio beeps/chimes and displays prominent high-contrast visual banners
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.visualAlertsOnly}
                    onChange={(e) => updateSetting('visualAlertsOnly', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'aac' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-bold text-base block text-white">
                    Integrated AAC & Alternative Communication
                  </span>
                  <span className="text-xs text-zinc-400">
                    Enables Type-to-Speak, 10 quick response buttons, and symbol communication boards
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.aacEnabled}
                  onChange={(e) => updateSetting('aacEnabled', e.target.checked)}
                  className="w-6 h-6 accent-yellow-400 rounded cursor-pointer"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Speech Rate: {settings.aacSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.aacSpeed}
                    onChange={(e) => updateSetting('aacSpeed', parseFloat(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>0.5x (Slow)</span>
                    <span>1.0x (Normal)</span>
                    <span>2.0x (Fast)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Speech Pitch: {settings.aacPitch}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={settings.aacPitch}
                    onChange={(e) => updateSetting('aacPitch', parseFloat(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>Lower</span>
                    <span>Standard</span>
                    <span>Higher</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Auto-Broadcast to Room Audio</span>
                    <span className="text-xs text-zinc-400">
                      When you click an AAC button or type a phrase, automatically speak it out loud to all participants
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.aacAutoBroadcast}
                    onChange={(e) => updateSetting('aacAutoBroadcast', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Permanently Dock AAC Toolbar in Rooms</span>
                    <span className="text-xs text-zinc-400">
                      Keeps the quick response buttons and symbol board accessible at the bottom of the room
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dockAacToolbar}
                    onChange={(e) => updateSetting('dockAacToolbar', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'mobility' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-bold text-base block text-white">
                    Single-Switch Scanning Support
                  </span>
                  <span className="text-xs text-zinc-400">
                    Cycles focus automatically across all interactive elements. Press Space or Enter to select.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.switchAccessEnabled}
                  onChange={(e) => updateSetting('switchAccessEnabled', e.target.checked)}
                  className="w-6 h-6 accent-yellow-400 rounded cursor-pointer"
                />
              </label>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                  Scanning Speed: {(settings.switchScanInterval / 1000).toFixed(1)} seconds
                </label>
                <input
                  type="range"
                  min="800"
                  max="4000"
                  step="200"
                  value={settings.switchScanInterval}
                  onChange={(e) => updateSetting('switchScanInterval', parseInt(e.target.value))}
                  className="w-full accent-yellow-400"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Fast (0.8s)</span>
                  <span>Moderate (1.8s)</span>
                  <span>Relaxed (4.0s)</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Large Touch / Click Targets (56px)</span>
                    <span className="text-xs text-zinc-400">
                      Increases button hit areas to assist users with tremors or limited dexterity
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.largeTouchTargets}
                    onChange={(e) => updateSetting('largeTouchTargets', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Dwell-Click Simulation</span>
                    <span className="text-xs text-zinc-400">
                      Hovering mouse or pointer over an action for 1.2s automatically activates it without clicking
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dwellClickEnabled}
                    onChange={(e) => updateSetting('dwellClickEnabled', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'cognitive' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-bold text-base block text-white">
                    Easy Read / Simple Language Mode
                  </span>
                  <span className="text-xs text-zinc-400">
                    Replaces jargon with plain, short, easy-to-understand labels and step-by-step guidance
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.simpleLanguageMode}
                  onChange={(e) => updateSetting('simpleLanguageMode', e.target.checked)}
                  className="w-6 h-6 accent-yellow-400 rounded cursor-pointer"
                />
              </label>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Structured Conversation Flow</span>
                    <span className="text-xs text-zinc-400">
                      Shows clear phase tracking (Intro, Topic, Queue, Discussion, Questions, Closing) and turn timers
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.structuredConversationMode}
                    onChange={(e) => updateSetting('structuredConversationMode', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Low Stimulation & Sensory Friendly</span>
                    <span className="text-xs text-zinc-400">
                      Eliminates bright flashes, pulsating effects, and sudden sound volume spikes
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.lowStimulationMode}
                    onChange={(e) => updateSetting('lowStimulationMode', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Reduced Motion</span>
                    <span className="text-xs text-zinc-400">
                      Disables all CSS transitions and animations to prevent vestibular disorientation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">Hide Participant Counts</span>
                    <span className="text-xs text-zinc-400">
                      Helps users with social anxiety participate without pressure
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hideParticipantCounts}
                    onChange={(e) => updateSetting('hideParticipantCounts', e.target.checked)}
                    className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'screenreader' && (
            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                <div>
                  <span className="font-bold text-base block text-white">
                    Live Screen Reader Announcements (ARIA)
                  </span>
                  <span className="text-xs text-zinc-400">
                    Provides vocal updates via aria-live for JAWS, NVDA, VoiceOver, and TalkBack
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.screenReaderAnnouncements}
                  onChange={(e) => updateSetting('screenReaderAnnouncements', e.target.checked)}
                  className="w-6 h-6 accent-yellow-400 rounded cursor-pointer"
                />
              </label>

              <div className="space-y-3">
                <span className="text-sm font-bold text-zinc-300 block">
                  Announcement Filters (Control what is spoken):
                </span>

                {[
                  { key: 'participants', label: 'Participant Join and Leave Events' },
                  { key: 'speaking', label: 'Speaker Starting and Stopping' },
                  { key: 'moderation', label: 'Moderator Actions (Mute, Speaking Permissions)' },
                  { key: 'messages', label: 'New Text Chat Messages' },
                  { key: 'aac', label: 'AAC Synthesized Speech Messages' },
                  { key: 'connectionStatus', label: 'Connection Status Updates' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer"
                  >
                    <span className="text-sm text-zinc-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(settings.announcementFilters as any)[item.key]}
                      onChange={(e) =>
                        updateSetting('announcementFilters', {
                          ...settings.announcementFilters,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-yellow-400 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4.5 border-t border-white/[0.08] bg-zinc-900/60">
          <button
            onClick={handleReset}
            className="btn-glass flex items-center space-x-2 rtl:space-x-reverse px-4.5 py-2.5 rounded-2xl text-zinc-300 hover:text-white text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('resetDefaults')}</span>
          </button>

          <button
            onClick={handleClose}
            className="btn-glow-accent flex items-center space-x-2 rtl:space-x-reverse px-6 py-2.5 rounded-2xl text-black text-sm font-black shadow-lg"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{t('savePreferences')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
