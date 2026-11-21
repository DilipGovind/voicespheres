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
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  MessageSquare,
  MessageSquareHeart,
  Smartphone,
} from 'lucide-react';

interface NavbarProps {
  onOpenAccessibility: () => void;
  onCreateRoom: () => void;
  onOpenProfile?: () => void;
  onOpenFeedback?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  currentUserName?: string;
  inRoom?: boolean;
}

export function Navbar({
  onOpenAccessibility,
  onCreateRoom,
  onOpenProfile,
  onOpenFeedback,
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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-zinc-950/85 backdrop-blur-xl shadow-lg shadow-black/40">
      {/* Skip link for keyboard & screen reader accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main accessible content
      </a>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 rtl:space-x-reverse min-w-0 flex-shrink-0">
          <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25 border border-white/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent whitespace-nowrap">
                VoiceSphere
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AAA 2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden lg:block truncate max-w-[220px]">
              {settings.simpleLanguageMode ? t('simpleTalkWithText') : t('appTagline').slice(0, 36) + '...'}
            </p>
          </div>
        </div>

        {/* Actions & Accessibility Bar */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 rtl:space-x-reverse flex-shrink-0">
          {/* Desktop-only secondary controls */}
          <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
            {/* Community Feedback Shortcut */}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                aria-label="Share Feedback and Ideas"
                className="flex items-center space-x-1.5 h-9 px-3 rounded-full border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-bold transition-all shadow-sm shadow-yellow-500/10 whitespace-nowrap flex-shrink-0 focus-visible:ring-4 focus-visible:ring-yellow-400 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquareHeart className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Community Notes</span>
              </button>
            )}

            {/* Android APK Download */}
            <a
              href="/voicesphere.apk"
              download="voicesphere.apk"
              aria-label="Download VoiceSphere Android App APK"
              className="flex items-center space-x-1.5 h-9 px-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 whitespace-nowrap flex-shrink-0 focus-visible:ring-4 focus-visible:ring-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
              title="Download Android APK (Direct Install)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Android App</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono">APK</span>
            </a>

            {/* Privacy Notice Shortcut */}
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                aria-label="View Prototype Privacy Notice"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-emerald-400 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
                title="Privacy First (Zero tracking, mutual transcript consent)"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* Language Selector (21 Languages) */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label={`Current language: ${localeInfo.nativeName}. Click to change language.`}
                aria-expanded={langMenuOpen}
                className="btn-glass flex items-center space-x-1.5 rtl:space-x-reverse h-9 px-3 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 focus:ring-4 focus:ring-yellow-400 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="whitespace-nowrap">{localeInfo.nativeName}</span>
              </button>

              {langMenuOpen && (
                <div
                  role="menu"
                  aria-label="Select platform language"
                  className="glass-panel absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl p-2 shadow-2xl z-50 divide-y divide-white/[0.06]"
                >
                  <div className="px-2.5 py-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
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
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition ${
                            isSelected
                              ? 'bg-yellow-400 text-black font-bold shadow-md'
                              : 'text-zinc-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="whitespace-nowrap">{info.nativeName}</span>
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
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label={`Account menu for ${user.displayName}`}
                  className="btn-glass flex items-center space-x-2 h-9 px-3 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                >
                  <span className="text-base flex-shrink-0">{user.avatar || '👤'}</span>
                  <span className="max-w-[100px] truncate whitespace-nowrap">{user.displayName}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    Free
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="glass-panel absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-60 rounded-2xl p-2.5 shadow-2xl z-50 divide-y divide-white/[0.08] text-xs">
                    <div className="px-3 py-2">
                      <p className="font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-zinc-400 text-[11px] font-mono truncate">@{user.username}</p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {user.role}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Free Account
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
                      {onOpenFeedback && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenFeedback();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Share Feedback</span>
                        </button>
                      )}
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
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => (onOpenAuth || openAuthModal)('login')}
                  className="btn-glass flex items-center space-x-1.5 h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => (onOpenAuth || openAuthModal)('register')}
                  className="btn-glow-accent flex items-center space-x-1.5 h-9 px-3.5 rounded-full text-xs font-black shadow-md whitespace-nowrap flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Free</span>
                </button>
              </div>
            )}
          </div>

          {/* Accessibility Center Button (Visible across all viewports) */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            aria-label={`Accessibility Center. Currently in ${settings.preset} mode.`}
            className="flex items-center space-x-1.5 rtl:space-x-reverse h-9 px-3 rounded-full border-2 border-yellow-400 bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-300 text-xs sm:text-sm font-bold shadow-md shadow-yellow-400/10 whitespace-nowrap flex-shrink-0 focus:ring-4 focus:ring-yellow-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sliders className="w-3.5 h-3.5 text-yellow-400 stroke-[2.5] flex-shrink-0" />
            <span className="hidden xl:inline whitespace-nowrap">{t('accessibilityCenter')}</span>
            <span className="hidden sm:inline xl:hidden whitespace-nowrap">A11Y</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase whitespace-nowrap flex-shrink-0">
              {settings.preset === 'DEFAULT' ? 'Preset' : settings.preset.split('_')[0]}
            </span>
          </button>

          {/* Create Room Button (Visible on sm+ viewports when not in room) */}
          {!inRoom && (
            <button
              type="button"
              onClick={onCreateRoom}
              aria-label={settings.simpleLanguageMode ? 'Create New Voice Room' : t('createRoom')}
              className="btn-glow-primary hidden sm:flex items-center space-x-1.5 rtl:space-x-reverse h-9 px-4 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 focus:ring-4 focus:ring-blue-400 transition-all"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">
                {settings.simpleLanguageMode ? 'Start Room' : 'Create Room'}
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
                    @{user.username} • Free Account
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
                <span>Register Free</span>
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

            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFeedback();
                }}
                className="flex items-center space-x-2 p-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/20"
              >
                <MessageSquareHeart className="w-4 h-4 text-yellow-400" />
                <span>Feedback</span>
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

            <a
              href="/voicesphere.apk"
              download="voicesphere.apk"
              className="flex items-center space-x-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android App (APK)</span>
            </a>

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
