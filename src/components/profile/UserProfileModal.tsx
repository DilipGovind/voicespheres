'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useAuth } from '@/lib/auth-context';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { User, Shield, Download, Trash2, X, Check, Lock, Coins, Sparkles, LogIn } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onUpdateName: (newName: string) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  currentName,
  onUpdateName,
}: UserProfileModalProps) {
  const { settings, resetDefaults, announce } = useAccessibility();
  const { user, updateProfile, openAuthModal, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || currentName);
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setPronouns(user.pronouns || '');
      setBio(user.bio || '');
    } else {
      setDisplayName(currentName);
      try {
        const savedPronouns = localStorage.getItem('voicesphere_pronouns');
        const savedBio = localStorage.getItem('voicesphere_bio');
        if (savedPronouns) setPronouns(savedPronouns);
        if (savedBio) setBio(savedBio);
      } catch {
        // ignore
      }
    }
  }, [user, currentName, isOpen]);

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onUpdateName(displayName.trim());
      if (user) {
        updateProfile({
          displayName: displayName.trim(),
          pronouns: pronouns.trim(),
          bio: bio.trim(),
        });
      }
      try {
        localStorage.setItem('voicesphere_username', displayName.trim());
        localStorage.setItem('voicesphere_pronouns', pronouns.trim());
        localStorage.setItem('voicesphere_bio', bio.trim());
      } catch {
        // ignore
      }
      setSavedSuccess(true);
      announce('Profile updated successfully.', 'polite');
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    }
  };

  const handleExportData = () => {
    const exportObject = {
      profile: { displayName, pronouns, bio },
      accessibilitySettings: settings,
      exportedAt: new Date().toISOString(),
      privacyPledge: 'VoiceSphere zero tracking guarantee: Data resides strictly on your device.',
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceSphere-User-Data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce('Personal data exported successfully.', 'polite');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear your local profile and accessibility data?')) {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
      resetDefaults();
      announce('All local data wiped.', 'assertive');
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-4 sm:p-8 text-zinc-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-lg">
              {user?.avatar || <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="profile-title" className="text-lg font-black text-white">
                  {user ? user.displayName : 'Pseudonymous Profile'}
                </h2>
                {user && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {user ? `@${user.username} • 🪙 ${user.coinsBalance} Coins` : 'Zero tracking, privacy-first local identity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close profile"
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-blue-300">Currently Browsing as Guest</p>
              <p className="text-[11px] text-zinc-400">Sign in or register to sync your rooms, AAC phrases, and coins across devices.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Screen Name / Handle
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Pronouns (Optional)
            </label>
            <input
              type="text"
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="e.g. they/them, she/her, he/him"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Short Bio or Communication Preferences
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Non-speaking AAC user, please allow extra time to respond..."
              rows={2}
              className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-medium text-sm focus:border-blue-500 placeholder-zinc-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-emerald-400 font-bold">
              <Shield className="w-4 h-4" />
              <span>Privacy-First Architecture</span>
            </div>
            <p>
              Your disability or accessibility preferences are stored locally in your browser and never sold or shared with third parties.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportData}
                className="p-2 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold flex items-center space-x-1"
                title="Export your profile & settings as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                type="button"
                onClick={handleClearData}
                className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center space-x-1"
                title="Wipe local profile and data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wipe Data</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1"
              >
                {savedSuccess && <Check className="w-4 h-4" />}
                <span>{savedSuccess ? 'Saved!' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
