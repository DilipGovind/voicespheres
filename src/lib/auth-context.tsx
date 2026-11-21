'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, RegisterInput, LoginInput } from '@/types/auth';
import {
  SEED_DEMO_USERS,
  getRegisteredUsers,
  registerNewUser,
  authenticateUser,
  saveCurrentSession,
  getSavedSession,
} from './auth-store';
import { useAccessibility } from './accessibility-context';
import { useI18n } from './i18n-context';
import { SupportedLocale } from '@/types/i18n';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (userOrId: UserAccount | string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserAccount>) => void;
  registeredUsers: UserAccount[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: 'login' | 'register' | 'demo';
  openAuthModal: (tab?: 'login' | 'register' | 'demo') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(SEED_DEMO_USERS);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'demo'>('login');

  const { applyPreset, announce } = useAccessibility();
  const { setLocale } = useI18n();

  // Load existing session on initial mount
  useEffect(() => {
    try {
      const all = getRegisteredUsers();
      setRegisteredUsers(all);

      const activeSession = getSavedSession();
      if (activeSession) {
        setUser(activeSession);
      } else {
        // Create an anonymous guest user if no session exists yet
        const guestId = localStorage.getItem('voicesphere_user_id') || 'guest_' + Math.random().toString(36).substring(2, 8);
        const guestName = localStorage.getItem('voicesphere_username') || 'GuestListener';
        localStorage.setItem('voicesphere_user_id', guestId);
        localStorage.setItem('voicesphere_username', guestName);
      }
    } catch {
      // ignore
    }
  }, []);

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'demo' = 'login') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
      // First try local store
      const localResult = authenticateUser(input);
      if (localResult.success && localResult.user) {
        setUser(localResult.user);
        saveCurrentSession(localResult.user);

        // Apply user's preferred preset and language if set
        if (localResult.user.preferredPreset) {
          applyPreset(localResult.user.preferredPreset as any);
        }
        if (localResult.user.preferredLanguage) {
          setLocale(localResult.user.preferredLanguage as SupportedLocale);
        }

        announce(`Welcome back, ${localResult.user.displayName}! Signed in successfully.`, 'polite');
        setRegisteredUsers(getRegisteredUsers());
        return { success: true };
      }

      // Fallback or attempt server API call
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (res.ok && data?.user) {
          setUser(data.user);
          saveCurrentSession(data.user);
          announce(`Signed in as ${data.user.displayName}`, 'polite');
          return { success: true };
        }
        return { success: false, error: data?.error || 'Authentication failed.' };
      } catch {
        return { success: false, error: localResult.error || 'Unable to sign in. Please try again.' };
      }
    },
    [applyPreset, setLocale, announce]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
      const localResult = registerNewUser(input);
      if (!localResult.success || !localResult.user) {
        return { success: false, error: localResult.error || 'Registration failed.' };
      }

      setUser(localResult.user);
      saveCurrentSession(localResult.user);
      setRegisteredUsers(getRegisteredUsers());

      // Sync with server in background
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).catch(() => {});

      if (localResult.user.preferredPreset) {
        applyPreset(localResult.user.preferredPreset as any);
      }
      if (localResult.user.preferredLanguage) {
        setLocale(localResult.user.preferredLanguage as SupportedLocale);
      }

      announce(`Welcome to VoiceSphere, ${localResult.user.displayName}! Account created with 100 free bonus coins.`, 'polite');
      return { success: true };
    },
    [applyPreset, setLocale, announce]
  );

  const demoLogin = useCallback(
    (userOrId: UserAccount | string) => {
      let targetUser: UserAccount | undefined;
      if (typeof userOrId === 'string') {
        targetUser = registeredUsers.find((u) => u.id === userOrId || u.username === userOrId);
      } else {
        targetUser = userOrId;
      }

      if (targetUser) {
        setUser(targetUser);
        saveCurrentSession(targetUser);

        if (targetUser.preferredPreset) {
          applyPreset(targetUser.preferredPreset as any);
        }
        if (targetUser.preferredLanguage) {
          setLocale(targetUser.preferredLanguage as SupportedLocale);
        }

        announce(`Logged in as demo persona: ${targetUser.displayName} (${targetUser.role})`, 'polite');
      }
    },
    [registeredUsers, applyPreset, setLocale, announce]
  );

  const logout = useCallback(() => {
    saveCurrentSession(null);
    setUser(null);
    announce('Signed out. You are now browsing as a guest.', 'polite');
  }, [announce]);

  const updateProfile = useCallback(
    (updates: Partial<UserAccount>) => {
      if (!user) return;
      const updated: UserAccount = { ...user, ...updates };
      setUser(updated);
      saveCurrentSession(updated);

      const all = getRegisteredUsers();
      const updatedList = all.map((u) => (u.id === updated.id ? updated : u));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('voicesphere_registered_users', JSON.stringify(updatedList));
        } catch {}
      }
      setRegisteredUsers(updatedList);
      announce('Profile updated successfully.', 'polite');
    },
    [user, announce]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isGuest: !user,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        registeredUsers,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
