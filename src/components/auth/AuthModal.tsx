'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAccessibility } from '@/lib/accessibility-context';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  UserPlus,
  Coins,
  ShieldCheck,
  ChevronRight,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import { SEED_DEMO_USERS } from '@/lib/auth-store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'demo';
}

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login, register, demoLogin, registeredUsers } = useAuth();
  const { announce } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPronouns, setRegPronouns] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regPreset, setRegPreset] = useState('DEFAULT');
  const [regIsAac, setRegIsAac] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMessage('');
    setSuccessMessage('');
  }, [initialTab, isOpen]);

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await login({
        identifier: loginIdentifier,
        password: loginPassword,
      });

      if (res.success) {
        setSuccessMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await register({
        displayName: regDisplayName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        pronouns: regPronouns,
        bio: regBio,
        preferredPreset: regPreset,
        isAacUser: regIsAac,
      });

      if (res.success) {
        setSuccessMessage('Welcome! Your account is created with 100 free bonus coins.');
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setErrorMessage(res.error || 'Could not complete registration.');
      }
    } catch {
      setErrorMessage('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoUser = (user: typeof SEED_DEMO_USERS[0]) => {
    demoLogin(user);
    setSuccessMessage(`Logged in as demo persona: ${user.displayName}`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg mx-auto rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-5 sm:p-8 text-zinc-100 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                VoiceSphere ID
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold flex items-center space-x-1">
                <Coins className="w-3 h-3" />
                <span>+100 Coins On Sign-Up</span>
              </span>
            </div>
            <h2 id="auth-modal-title" className="text-2xl font-black text-white pt-1">
              {activeTab === 'login' && 'Sign In to VoiceSphere'}
              {activeTab === 'register' && 'Join the Inclusive Community'}
              {activeTab === 'demo' && 'Quick Instant Demo Logins'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {activeTab === 'login' && 'Access your personalized accessibility presets, saved AAC phrases & rooms.'}
              {activeTab === 'register' && 'Pseudonymous or real name: zero invasive tracking, 100% accessible.'}
              {activeTab === 'demo' && 'Experience the platform through pre-configured diverse accessibility personas.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication window"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-2xl bg-zinc-900/90 p-1 border border-zinc-800 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'register'
                ? 'bg-yellow-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('demo');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'demo'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Demo Logins</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. elena_a11y or elena@voicesphere.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password (e.g. pass123)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-500" />
                <span>Remember me on this browser</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                className="text-blue-400 hover:underline font-semibold"
              >
                Use 1-Click Demo Account
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800">
              <span>New to VoiceSphere? </span>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-yellow-400 hover:underline font-bold"
              >
                Create a Free Account
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Display / Pseudonym *
                </label>
                <input
                  type="text"
                  required
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="e.g. Alex Walker"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Username (@handle) *
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. alex_voice"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Pronouns (optional)
                </label>
                <input
                  type="text"
                  value={regPronouns}
                  onChange={(e) => setRegPronouns(e.target.value)}
                  placeholder="they/them, she/her, he/him"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose a secure password"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
              />
            </div>

            {/* Accessibility Focus Selection */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
              <label className="block text-xs font-bold text-yellow-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Primary Accessibility Preference (Optional)</span>
              </label>
              <select
                value={regPreset}
                onChange={(e) => setRegPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-zinc-200 focus:ring-4 focus:ring-yellow-400"
              >
                <option value="DEFAULT">Standard Universal (Balanced)</option>
                <option value="PRESET_A_BLIND_SCREEN_READER">Preset A: Blind & Screen Reader Priority</option>
                <option value="PRESET_B_LOW_VISION_ZOOM">Preset B: Low Vision & 200% High Contrast</option>
                <option value="PRESET_C_AAC_NON_SPEAKING">Preset C: Non-Speaking & AAC Symbol Board</option>
                <option value="PRESET_D_DYSLEXIA_FRIENDLY">Preset D: Dyslexia Friendly & Reading Ruler</option>
                <option value="PRESET_E_SENSORY_LOW_STIM">Preset E: Sensory Friendly & Low Stimulation</option>
                <option value="PRESET_F_MOTOR_SWITCH_SCAN">Preset F: Motor Disability & Single-Switch Scan</option>
              </select>

              <label className="flex items-center space-x-2 pt-1 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regIsAac}
                  onChange={(e) => setRegIsAac(e.target.checked)}
                  className="w-4 h-4 rounded accent-yellow-400"
                />
                <span>Enable AAC Symbol Board & Type-To-Speak synthesis by default</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-extrabold text-sm shadow-xl shadow-yellow-400/20 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration (+100 Coins)'}</span>
              <Coins className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 3: Demo Logins */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Select any pre-configured community member persona to immediately explore their setup:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {SEED_DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleSelectDemoUser(demo)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 text-left transition group focus:ring-2 focus:ring-yellow-400"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-zinc-800 flex-shrink-0">
                      {demo.avatar}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-sm text-white group-hover:text-yellow-300 transition">
                          {demo.displayName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          @{demo.username}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {demo.role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-xs sm:max-w-sm">
                        {demo.bio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                    <span className="text-xs font-bold text-yellow-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                      Login &rarr;
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-yellow-400 transition" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Pledge */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero cookies, zero telemetry, privacy-first authentication.</span>
          </div>
          <span className="font-mono">AGPL-3.0</span>
        </div>
      </div>
    </div>
  );
}
