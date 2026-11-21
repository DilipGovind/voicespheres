import { UserAccount, UserRole } from '@/types/auth';

export interface ServerUserRecord extends UserAccount {
  passwordHash?: string;
}

export const INITIAL_COMMUNITY_USERS: ServerUserRecord[] = [
  {
    id: 'user_marcus',
    username: 'marcus_aac',
    displayName: 'Marcus Chen',
    email: 'marcus@voicesphere.org',
    passwordHash: 'Pass123!',
    avatar: '🦉',
    role: 'member' as UserRole,
    pronouns: 'he/him',
    bio: 'AAC user & accessible audio advocate. Speaking via synthesized voice.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_C_AAC_NON_SPEAKING',
    isAacUser: true,
    coinsBalance: 100,
    trialDaysLeft: 365,
    createdAt: 1732180000000,
    lastLoginAt: 1732180000000,
  },
  {
    id: 'user_elena',
    username: 'elena_a11y',
    displayName: 'Elena Rostova',
    email: 'elena@voicesphere.org',
    passwordHash: 'Pass123!',
    avatar: '🌟',
    role: 'member' as UserRole,
    pronouns: 'she/her',
    bio: 'Screen reader tester & accessibility auditor. Passionate about WCAG AAA compliance.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_A_BLIND_SCREEN_READER',
    isAacUser: false,
    coinsBalance: 100,
    trialDaysLeft: 365,
    createdAt: 1732170000000,
    lastLoginAt: 1732170000000,
  },
  {
    id: 'user_amina',
    username: 'amina_voice',
    displayName: 'Amina Al-Mansoor',
    email: 'amina@voicesphere.org',
    passwordHash: 'Pass123!',
    avatar: '🎨',
    role: 'moderator' as UserRole,
    pronouns: 'she/they',
    bio: 'Community host & multilingual RTL accessibility specialist.',
    preferredLanguage: 'ar',
    preferredPreset: 'DEFAULT',
    isAacUser: false,
    coinsBalance: 100,
    trialDaysLeft: 365,
    createdAt: 1732160000000,
    lastLoginAt: 1732160000000,
  },
  {
    id: 'user_david',
    username: 'david_sensory',
    displayName: 'David Miller',
    email: 'david@voicesphere.org',
    passwordHash: 'Pass123!',
    avatar: '🌊',
    role: 'member' as UserRole,
    pronouns: 'he/him',
    bio: 'Sensory-sensitive audio tester & low-stimulation enthusiast.',
    preferredLanguage: 'en',
    preferredPreset: 'PRESET_E_SENSORY_LOW_STIM',
    isAacUser: false,
    coinsBalance: 100,
    trialDaysLeft: 365,
    createdAt: 1732150000000,
    lastLoginAt: 1732150000000,
  },
];

// Global persistent container across hot reloads & worker threads
const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};

function getRuntimeNodeModule(name: string) {
  try {
    if (typeof process !== 'undefined' && process?.versions?.node) {
      const dynamicReq = eval('require');
      return dynamicReq(name);
    }
  } catch {
    return null;
  }
  return null;
}

if (!g.__voicesphere_users_map) {
  g.__voicesphere_users_map = new Map<string, ServerUserRecord>();

  INITIAL_COMMUNITY_USERS.forEach((u) => {
    g.__voicesphere_users_map.set(u.id, u);
    g.__voicesphere_users_map.set(u.username.toLowerCase(), u);
    g.__voicesphere_users_map.set(u.email.toLowerCase(), u);
  });

  // Try hydrating registered users from disk in Node.js runtime
  try {
    const fs = getRuntimeNodeModule('fs');
    const path = getRuntimeNodeModule('path');
    if (fs && path) {
      const dataDir = path.join(process.cwd(), '.data');
      const usersFile = path.join(dataDir, 'community_users.json');
      if (fs.existsSync(usersFile)) {
        const raw = fs.readFileSync(usersFile, 'utf8');
        const list: ServerUserRecord[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((u) => {
            if (u && u.id && u.username) {
              g.__voicesphere_users_map.set(u.id, u);
              g.__voicesphere_users_map.set(u.username.toLowerCase(), u);
              if (u.email) g.__voicesphere_users_map.set(u.email.toLowerCase(), u);
            }
          });
        }
      }
    }
  } catch {
    // Non-fatal edge fallback
  }
}

export const serverUsersMap: Map<string, ServerUserRecord> = g.__voicesphere_users_map;

function persistUsersToDisk() {
  try {
    const fs = getRuntimeNodeModule('fs');
    const path = getRuntimeNodeModule('path');
    if (fs && path) {
      const dataDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const usersFile = path.join(dataDir, 'community_users.json');
      const seen = new Set<string>();
      const customUsers: ServerUserRecord[] = [];
      const initialIds = new Set(INITIAL_COMMUNITY_USERS.map((u) => u.id));

      serverUsersMap.forEach((user) => {
        if (!seen.has(user.id)) {
          seen.add(user.id);
          if (!initialIds.has(user.id)) {
            customUsers.push(user);
          }
        }
      });
      fs.writeFileSync(usersFile, JSON.stringify(customUsers, null, 2), 'utf8');
    }
  } catch {
    // Edge/serverless fallback
  }
}

export function registerServerUser(user: ServerUserRecord): boolean {
  const usernameKey = user.username.trim().toLowerCase();
  const emailKey = user.email.trim().toLowerCase();

  if (serverUsersMap.has(usernameKey) || serverUsersMap.has(emailKey)) {
    return false;
  }

  serverUsersMap.set(user.id, user);
  serverUsersMap.set(usernameKey, user);
  serverUsersMap.set(emailKey, user);

  persistUsersToDisk();
  return true;
}

export function findServerUser(identifier: string): ServerUserRecord | undefined {
  const key = identifier.trim().toLowerCase();
  return serverUsersMap.get(key);
}

export function getAllServerUsers(): UserAccount[] {
  const seen = new Set<string>();
  const list: UserAccount[] = [];

  serverUsersMap.forEach((user) => {
    if (!seen.has(user.id)) {
      seen.add(user.id);
      const { passwordHash, ...safeUser } = user;
      list.push(safeUser);
    }
  });

  return list.sort((a, b) => b.createdAt - a.createdAt);
}
