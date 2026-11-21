export type UserRole = 'member' | 'moderator' | 'admin' | 'verified_creator';

export interface UserAccount {
  id: string;
  username: string; // unique handle e.g. "elena_screenreader"
  displayName: string; // e.g. "Elena Rostova"
  email: string;
  passwordHash?: string; // simplified mock password hash
  avatar: string; // URL or emoji/preset
  role: UserRole;
  pronouns?: string;
  bio?: string;
  preferredLanguage?: string;
  preferredPreset?: string;
  isAacUser?: boolean;
  coinsBalance: number;
  trialDaysLeft: number;
  createdAt: number;
  lastLoginAt?: number;
}

export interface RegisterInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
  pronouns?: string;
  bio?: string;
  preferredLanguage?: string;
  preferredPreset?: string;
  isAacUser?: boolean;
}

export interface LoginInput {
  identifier: string; // email or username
  password: string;
}

export interface AuthSession {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}
