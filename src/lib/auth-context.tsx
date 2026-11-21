'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, RegisterInput, LoginInput } from '@/types/auth';
import {
  getRegisteredUsers,
  registerNewUser,
  authenticateUser,
  saveCurrentSession,
  getSavedSession,
} from './auth-store';
import { useAccessibility } from './accessibility-context';
import { useI18n } from './i18n-context';
import { SupportedLocale } from '@/types/i18n';
import { realtimeClient } from './socket-client';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserAccount>) => void;
  registeredUsers: UserAccount[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');

  const { applyPreset, announce } = useAccessibility();
  const { setLocale } = useI18n();

  const syncRemoteUsers = useCallback(async () => {
    try {
      // 1. Publish locally registered custom users to server so all devices discover them
      const local = getRegisteredUsers();
      if (local.length > 0) {
        fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: local }),
        }).catch(() => {});
      }

      // 2. Fetch latest aggregated user accounts from server
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data?.users && Array.isArray(data.users)) {
        const map = new Map<string, UserAccount>();
        local.forEach((u) => map.set(u.id, u));
        data.users.forEach((u: UserAccount) => {
          if (!map.has(u.id)) {
            map.set(u.id, u);
          } else {
            map.set(u.id, { ...map.get(u.id)!, ...u });
          }
        });
        const combined = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        setRegisteredUsers(combined);
        try {
          localStorage.setItem('voicesphere_registered_users', JSON.stringify(combined));
        } catch {}
      }
    } catch {}
  }, []);

  // Load existing session and sync cross-device users on initial mount
  useEffect(() => {
    try {
      const all = getRegisteredUsers();
      setRegisteredUsers(all);

      const activeSession = getSavedSession();
      if (activeSession) {
        setUser(activeSession);
      } else {
        // Create an anonymous guest identifier if no session exists yet
        const guestId = localStorage.getItem('voicesphere_user_id') || 'guest_' + Math.random().toString(36).substring(2, 8);
        const guestName = localStorage.getItem('voicesphere_username') || 'GuestListener';
        localStorage.setItem('voicesphere_user_id', guestId);
        localStorage.setItem('voicesphere_username', guestName);
      }
    } catch {
      // ignore
    }

    // Sync remote users on startup
    syncRemoteUsers();

    // Fast polling: every 2 seconds for instant cross-device detection
    const interval = setInterval(syncRemoteUsers, 2000);

    // Instant sync on window focus or visibility restore
    const handleFocus = () => syncRemoteUsers();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncRemoteUsers();
    });

    // Listen to real-time cross-device registration events
    const unsub = realtimeClient.on('global:user_registered', (payload: any) => {
      const newUser: UserAccount = payload?.user || payload;
      if (newUser && newUser.id) {
        setRegisteredUsers((prev) => {
          if (prev.some((u) => u.id === newUser.id)) return prev;
          const updated = [newUser, ...prev];
          try {
            localStorage.setItem('voicesphere_registered_users', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      unsub();
    };
  }, [syncRemoteUsers]);

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    syncRemoteUsers(); // Instant sync when user opens auth dialog
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  }, [syncRemoteUsers]);

  const login = useCallback(
    async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
      // First try local store
      const localResult = authenticateUser(input);
      if (localResult.success && localResult.user) {
        setUser(localResult.user);
        saveCurrentSession(localResult.user);

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

      // Fallback to API route
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
          const current = getRegisteredUsers();
          if (!current.some((u) => u.id === data.user.id)) {
            const updated = [data.user, ...current];
            setRegisteredUsers(updated);
            try {
              localStorage.setItem('voicesphere_registered_users', JSON.stringify(updated));
            } catch {}
          }
          if (data.user.preferredPreset) {
            applyPreset(data.user.preferredPreset as any);
          }
          if (data.user.preferredLanguage) {
            setLocale(data.user.preferredLanguage as SupportedLocale);
          }
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

      // Sync with server API and broadcast to other devices
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
      } catch {}

      realtimeClient.broadcastUserRegistered(localResult.user);

      if (localResult.user.preferredPreset) {
        applyPreset(localResult.user.preferredPreset as any);
      }
      if (localResult.user.preferredLanguage) {
        setLocale(localResult.user.preferredLanguage as SupportedLocale);
      }

      announce(`Welcome to VoiceSphere, ${localResult.user.displayName}! Your free account is active.`, 'polite');
      return { success: true };
    },
    [applyPreset, setLocale, announce]
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
