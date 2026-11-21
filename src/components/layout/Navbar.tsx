'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/types/i18n';
import {
  Volume2,
  Sliders,
  Globe,
  PlusCircle,
  Radio,
  BookOpen,
  User,
  Coins,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenAccessibility: () => void;
  onCreateRoom: () => void;
  onOpenProfile?: () => void;
  onOpenTrialCoins?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register' | 'demo') => void;
  currentUserName?: string;
  inRoom?: boolean;
}

export function Navbar({
  onOpenAccessibility,
  onCreateRoom,
  onOpenProfile,
  onOpenTrialCoins,
  onOpenPrivacy,
  onOpenAuth,
  currentUserName,
  inRoom = false,
}: NavbarProps) {
  const { settings } = useAccessibility();
  const { locale, setLocale, localeInfo, t } = useI18n();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      {/* Skip link for keyboard & screen reader accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main accessible content
      </a>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full overflow-hidden">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                VoiceSphere
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                A11Y AAA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block truncate">
              {settings.simpleLanguageMode ? t('simpleTalkWithText') : t('appTagline').slice(0, 48) + '...'}
            </p>
          </div>
        </div>

        {/* Actions & Accessibility Bar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 rtl:space-x-reverse">
          {/* Desktop-only secondary controls */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
            {/* Demo Trial & Coins Shortcut */}
            {onOpenTrialCoins && (
              <button
                type="button"
                onClick={onOpenTrialCoins}
                aria-label="Open 30-Day Trial and Demo Coins"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs sm:text-sm font-bold transition focus-visible:ring-4 focus-visible:ring-yellow-400"
              >
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>30d Demo Trial</span>
              </button>
            )}

            {/* Privacy Notice Shortcut */}
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                aria-label="View Prototype Privacy Notice"
                className="p-1.5 sm:p-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition"
                title="Privacy Notice (No audio recording)"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

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
                <span>{localeInfo.nativeName}</span>
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

            {/* User Account / Auth Shortcut */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label={`Account menu for ${user.displayName}`}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-200 transition"
                >
                  <span className="text-base">{user.avatar || '👤'}</span>
                  <span className="max-w-[110px] truncate">{user.displayName}</span>
                  <span className="hidden xl:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                    🪙 {user.coinsBalance}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-2 shadow-2xl z-50 divide-y divide-zinc-800 text-xs">
                    <div className="px-3 py-2">
                      <p className="font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-zinc-400 text-[11px] font-mono truncate">@{user.username}</p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {user.role}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                          🪙 {user.coinsBalance} Coins
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenProfile) onOpenProfile();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          (onOpenAuth || openAuthModal)('demo');
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Switch Demo Persona</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => (onOpenAuth || openAuthModal)('login')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs sm:text-sm font-semibold transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => (onOpenAuth || openAuthModal)('register')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Accessibility Center Button (Visible across all viewports) */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            aria-label={`Accessibility Center. Currently in ${settings.preset} mode.`}
            className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border-2 border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 text-xs sm:text-sm font-bold shadow-sm focus:ring-4 focus:ring-yellow-400 transition"
          >
            <Sliders className="w-4 h-4 text-yellow-400 stroke-[2.5]" />
            <span className="hidden md:inline">{t('accessibilityCenter')}</span>
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-black uppercase">
              {settings.preset === 'DEFAULT' ? 'A11Y' : settings.preset.split('_')[0]}
            </span>
          </button>

          {/* Create Room Button (Visible on sm+ viewports when not in room) */}
          {!inRoom && (
            <button
              type="button"
              onClick={onCreateRoom}
              aria-label={settings.simpleLanguageMode ? 'Create New Voice Room' : t('createRoom')}
              className="hidden sm:flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 focus:ring-4 focus:ring-blue-400 transition"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden md:inline">
                {settings.simpleLanguageMode ? 'Start Room' : t('createRoom')}
              </span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle (screens < 768px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition focus:ring-2 focus:ring-yellow-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-yellow-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          role="region"
          aria-label="Mobile Navigation Menu"
          className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200"
        >
          {/* User Auth Bar in Mobile Menu */}
          {user ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="text-xl">{user.avatar || '👤'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    @{user.username} • 🪙 {user.coinsBalance} Coins
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  (onOpenAuth || openAuthModal)('login');
                }}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-xs font-bold transition"
              >
                <LogIn className="w-4 h-4 text-blue-400" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  (onOpenAuth || openAuthModal)('register');
                }}
                className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl bg-yellow-400 text-black text-xs font-bold transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register (+100)</span>
              </button>
            </div>
          )}

          {!inRoom && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onCreateRoom();
              }}
              className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition mb-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{settings.simpleLanguageMode ? 'Start Room' : t('createRoom')}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="flex items-center space-x-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:border-zinc-700"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="truncate">{currentUserName || 'Profile'}</span>
              </button>
            )}

            {onOpenTrialCoins && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTrialCoins();
                }}
                className="flex items-center space-x-2 p-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/20"
              >
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>30d Demo Trial</span>
              </button>
            )}

            {onOpenPrivacy && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacy();
                }}
                className="flex items-center space-x-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:border-zinc-700"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Privacy Notice</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
              }}
              className="flex items-center space-x-2 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:border-zinc-700"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="truncate">{localeInfo.nativeName}</span>
            </button>
          </div>

          {langMenuOpen && (
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Select Language (21 Global Options)
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((code) => {
                  const info = SUPPORTED_LOCALES[code];
                  const isSelected = locale === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLocale(code);
                        setLangMenuOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-lg text-left text-xs font-medium transition ${
                        isSelected
                          ? 'bg-yellow-400 text-black font-bold'
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="truncate block">{info.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
