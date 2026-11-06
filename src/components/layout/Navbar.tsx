'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/types/i18n';
import {
  Volume2,
  Sliders,
  Globe,
  PlusCircle,
  Radio,
  BookOpen,
  User,
} from 'lucide-react';

interface NavbarProps {
  onOpenAccessibility: () => void;
  onCreateRoom: () => void;
  onOpenProfile?: () => void;
  currentUserName?: string;
  inRoom?: boolean;
}

export function Navbar({
  onOpenAccessibility,
  onCreateRoom,
  onOpenProfile,
  currentUserName,
  inRoom = false,
}: NavbarProps) {
  const { settings } = useAccessibility();
  const { locale, setLocale, localeInfo, t } = useI18n();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      {/* Skip link for keyboard & screen reader accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main accessible content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-xl font-black tracking-tight text-white">
                VoiceSphere
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                A11Y AAA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {settings.simpleLanguageMode ? t('simpleTalkWithText') : t('appTagline').slice(0, 48) + '...'}
            </p>
          </div>
        </div>

        {/* Actions & Accessibility Bar */}
        <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
          {/* Language Selector (21 Languages) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label={`Current language: ${localeInfo.nativeName}. Click to change language.`}
              aria-expanded={langMenuOpen}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-200 focus:ring-4 focus:ring-yellow-400 transition"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">{localeInfo.nativeName}</span>
              <span className="sm:hidden font-mono uppercase">{locale}</span>
            </button>

            {langMenuOpen && (
              <div
                role="menu"
                aria-label="Select platform language"
                className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-2 shadow-2xl z-50 divide-y divide-zinc-800/60"
              >
                <div className="px-2 py-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  21 Global Languages
                </div>
                <div className="py-1">
                  {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((code) => {
                    const info = SUPPORTED_LOCALES[code];
                    const isSelected = locale === code;
                    return (
                      <button
                        key={code}
                        role="menuitem"
                        onClick={() => {
                          setLocale(code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition ${
                          isSelected
                            ? 'bg-yellow-400 text-black font-bold'
                            : 'text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        <span>{info.nativeName}</span>
                        <span className="text-[11px] opacity-75 font-mono">{info.country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accessibility Center Button */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            aria-label={`Accessibility Center. Currently in ${settings.preset} mode.`}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 sm:py-2 rounded-xl border-2 border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 text-xs sm:text-sm font-bold shadow-sm focus:ring-4 focus:ring-yellow-400 transition"
          >
            <Sliders className="w-4 h-4 text-yellow-400 stroke-[2.5]" />
            <span className="hidden md:inline">{t('accessibilityCenter')}</span>
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-black uppercase">
              {settings.preset === 'DEFAULT' ? 'A11Y' : settings.preset.split('_')[0]}
            </span>
          </button>

          {/* Profile Shortcut */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label={`User profile for ${currentUserName || 'User'}`}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs sm:text-sm font-semibold transition"
            >
              <User className="w-4 h-4 text-blue-400" />
              <span className="hidden lg:inline">{currentUserName || 'Profile'}</span>
            </button>
          )}

          {/* Create Room Button (When not inside a room) */}
          {!inRoom && (
            <button
              type="button"
              onClick={onCreateRoom}
              aria-label={settings.simpleLanguageMode ? 'Create New Voice Room' : t('createRoom')}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 focus:ring-4 focus:ring-blue-400 transition"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {settings.simpleLanguageMode ? 'Start Room' : t('createRoom')}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
