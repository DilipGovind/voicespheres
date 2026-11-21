import { UserAccount, RegisterInput, LoginInput } from '@/types/auth';

const USERS_STORAGE_KEY = 'voicesphere_registered_users';
const SESSION_STORAGE_KEY = 'voicesphere_auth_session';

const memoryFallbackUsers: UserAccount[] = [];

/**
 * Retrieves all registered users.
 */
export function getRegisteredUsers(): UserAccount[] {
  if (typeof window === 'undefined') {
    return memoryFallbackUsers;
  }

  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: UserAccount[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return memoryFallbackUsers;
  }
}

/**
 * Register a brand new user account completely free.
 */
export function registerNewUser(input: RegisterInput): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredUsers();

  const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanEmail = input.email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  if (input.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Check duplicate username or email
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );
  if (existingUser) {
    return { success: false, error: 'An account with that username or email already exists.' };
  }

  // Choose an accessible avatar emoji
  const avatars = ['🌟', '🦉', '🎨', '🚀', '🌈', '🌻', '💡', '🎵', '⚡', '🌊', '🎙️', '✨'];
  const assignedAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const newUser: UserAccount = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: cleanUsername,
    displayName: input.displayName.trim() || cleanUsername,
    email: cleanEmail,
    passwordHash: input.password,
    avatar: assignedAvatar,
    role: 'member',
    pronouns: input.pronouns?.trim() || undefined,
    bio: input.bio?.trim() || 'VoiceSphere community member.',
    preferredLanguage: input.preferredLanguage || 'en',
    preferredPreset: input.preferredPreset || 'DEFAULT',
    isAacUser: Boolean(input.isAacUser),
    coinsBalance: 100,
    trialDaysLeft: 365,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  const updatedUsers = [newUser, ...users];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      saveCurrentSession(newUser);
    } catch {
      // ignore
    }
  } else {
    memoryFallbackUsers.unshift(newUser);
  }

  return { success: true, user: newUser };
}

/**
 * Authenticate existing user via username/email and password.
 */
export function authenticateUser(input: LoginInput): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredUsers();
  const idLower = input.identifier.trim().toLowerCase();

  const found = users.find(
    (u) => u.username.toLowerCase() === idLower || u.email.toLowerCase() === idLower
  );

  if (!found) {
    return { success: false, error: 'No account found with this username or email.' };
  }

  if (found.passwordHash && found.passwordHash !== input.password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const updatedUser: UserAccount = {
    ...found,
    lastLoginAt: Date.now(),
  };

  saveCurrentSession(updatedUser);
  return { success: true, user: updatedUser };
}

/**
 * Save user session to storage and sync legacy keys.
 */
export function saveCurrentSession(user: UserAccount | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('voicesphere_username', user.displayName);
      localStorage.setItem('voicesphere_user_id', user.id);
      if (user.pronouns) localStorage.setItem('voicesphere_pronouns', user.pronouns);
      if (user.bio) localStorage.setItem('voicesphere_bio', user.bio);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieve current active user session.
 */
export function getSavedSession(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
