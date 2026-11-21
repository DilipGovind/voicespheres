import { UserAccount, RegisterInput, LoginInput } from '@/types/auth';

export const SEED_DEMO_USERS: UserAccount[] = [
  {
    id: 'user_elena_01',
    username: 'elena_a11y',
    displayName: 'Elena Rostova',
    email: 'elena@voicesphere.org',
    passwordHash: 'pass123',
    avatar: '👩‍🦯',
    role: 'verified_creator',
    pronouns: 'she/her',
    bio: 'Blind accessibility advocate, screen-reader tester & podcast creator. Passionate about non-visual digital design.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_A_BLIND_SCREEN_READER',
    isAacUser: false,
    coinsBalance: 350,
    trialDaysLeft: 28,
    createdAt: Date.now() - 30 * 86400000,
    lastLoginAt: Date.now(),
  },
  {
    id: 'user_marcus_02',
    username: 'marcus_aac',
    displayName: 'Marcus Chen',
    email: 'marcus@voicesphere.org',
    passwordHash: 'pass123',
    avatar: '💻',
    role: 'member',
    pronouns: 'he/they',
    bio: 'Non-speaking AAC communicator & software engineer. Using text-to-speech symbol synthesis to host tech roundtables.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_C_AAC_NON_SPEAKING',
    isAacUser: true,
    coinsBalance: 240,
    trialDaysLeft: 25,
    createdAt: Date.now() - 20 * 86400000,
    lastLoginAt: Date.now(),
  },
  {
    id: 'user_amina_03',
    username: 'amina_voice',
    displayName: 'Amina Al-Mansoor',
    email: 'amina@voicesphere.org',
    passwordHash: 'pass123',
    avatar: '🎙️',
    role: 'moderator',
    pronouns: 'she/her',
    bio: 'Global community moderator. Facilitates cross-cultural discussions in Arabic and English with real-time translation.',
    preferredLanguage: 'ar',
    preferredPreset: 'DEFAULT',
    isAacUser: false,
    coinsBalance: 520,
    trialDaysLeft: 30,
    createdAt: Date.now() - 45 * 86400000,
    lastLoginAt: Date.now(),
  },
  {
    id: 'user_david_04',
    username: 'david_sensory',
    displayName: 'David Miller',
    email: 'david@voicesphere.org',
    passwordHash: 'pass123',
    avatar: '🎧',
    role: 'member',
    pronouns: 'he/him',
    bio: 'Neurodivergent & sensory-sensitive listener. Hosting low-stimulation co-working lounges and gentle ambient audio rooms.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_E_SENSORY_LOW_STIM',
    isAacUser: false,
    coinsBalance: 160,
    trialDaysLeft: 22,
    createdAt: Date.now() - 15 * 86400000,
    lastLoginAt: Date.now(),
  },
  {
    id: 'user_priya_05',
    username: 'priya_sharma',
    displayName: 'Dr. Priya Sharma',
    email: 'priya@voicesphere.org',
    passwordHash: 'pass123',
    avatar: '🔬',
    role: 'verified_creator',
    pronouns: 'she/her',
    bio: 'Assistive tech researcher & multilingual advocate. Hosting weekly rooms on dyspraxia, dyslexia & inclusive EdTech.',
    preferredLanguage: 'hi',
    preferredPreset: 'PRESET_D_DYSLEXIA_FRIENDLY',
    isAacUser: false,
    coinsBalance: 410,
    trialDaysLeft: 29,
    createdAt: Date.now() - 50 * 86400000,
    lastLoginAt: Date.now(),
  },
];

const USERS_STORAGE_KEY = 'voicesphere_registered_users';
const SESSION_STORAGE_KEY = 'voicesphere_auth_session';

const memoryFallbackUsers: UserAccount[] = [...SEED_DEMO_USERS];

/**
 * Retrieves all registered users (seed users merged with local registrations).
 */
export function getRegisteredUsers(): UserAccount[] {
  if (typeof window === 'undefined') {
    return memoryFallbackUsers;
  }

  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Seed initial users into storage
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_DEMO_USERS));
      return SEED_DEMO_USERS;
    }
    const parsed: UserAccount[] = JSON.parse(raw);
    // Ensure all demo users exist in the stored list
    const idMap = new Map<string, UserAccount>();
    SEED_DEMO_USERS.forEach((u) => idMap.set(u.id, u));
    parsed.forEach((u) => idMap.set(u.id, u));
    return Array.from(idMap.values());
  } catch {
    return memoryFallbackUsers;
  }
}

/**
 * Register a brand new user account.
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

  // Choose an accessible avatar emoji based on preference or random
  const avatars = ['🌟', '🦉', '🎨', '🚀', '🌈', '🌻', '💡', '🎵', '⚡', '🌊'];
  const assignedAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const newUser: UserAccount = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: cleanUsername,
    displayName: input.displayName.trim() || cleanUsername,
    email: cleanEmail,
    passwordHash: input.password, // In a client prototype, store password
    avatar: assignedAvatar,
    role: 'member',
    pronouns: input.pronouns?.trim() || undefined,
    bio: input.bio?.trim() || 'New VoiceSphere community member.',
    preferredLanguage: input.preferredLanguage || 'en',
    preferredPreset: input.preferredPreset || 'DEFAULT',
    isAacUser: Boolean(input.isAacUser),
    coinsBalance: 100, // 100 bonus trial coins for new registration
    trialDaysLeft: 30,
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

  // Allow standard password or demo shortcut
  if (found.passwordHash && found.passwordHash !== input.password && input.password !== 'pass123') {
    return { success: false, error: 'Incorrect password. Try again or use a demo login.' };
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
      // Sync legacy localStorage keys so existing components work out-of-the-box
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
