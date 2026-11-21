import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRegisteredUsers,
  registerNewUser,
  authenticateUser,
  saveCurrentSession,
  getSavedSession,
} from '../src/lib/auth-store';

describe('User Authentication & Free Registration System', () => {
  it('registers a new user account with clean free credentials', () => {
    const uniqueHandle = 'tester_' + Date.now().toString(36);
    const uniqueEmail = `test_${Date.now()}@voicesphere.org`;

    const res = registerNewUser({
      username: uniqueHandle,
      displayName: 'Inclusive Advocate',
      email: uniqueEmail,
      password: 'StrongPassword123!',
      pronouns: 'they/them',
      bio: 'Testing voice rooms and accessibility presets',
      preferredPreset: 'PRESET_C_AAC_NON_SPEAKING',
      isAacUser: true,
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.username).toBe(uniqueHandle);
    expect(res.user?.displayName).toBe('Inclusive Advocate');
    expect(res.user?.email).toBe(uniqueEmail);
    expect(res.user?.role).toBe('member');
    expect(res.user?.isAacUser).toBe(true);
    expect(res.user?.preferredPreset).toBe('PRESET_C_AAC_NON_SPEAKING');
  });

  it('authenticates the registered user using their unique username', () => {
    const uniqueHandle = 'handle_' + Date.now().toString(36);
    const uniqueEmail = `auth_${Date.now()}@example.com`;

    registerNewUser({
      username: uniqueHandle,
      displayName: 'Authentic User',
      email: uniqueEmail,
      password: 'MySecretPassword123',
    });

    const loginRes = authenticateUser({
      identifier: uniqueHandle,
      password: 'MySecretPassword123',
    });

    expect(loginRes.success).toBe(true);
    expect(loginRes.user).toBeDefined();
    expect(loginRes.user?.username).toBe(uniqueHandle);
    expect(loginRes.user?.displayName).toBe('Authentic User');
  });

  it('authenticates the registered user using their email address', () => {
    const uniqueHandle = 'emailuser_' + Date.now().toString(36);
    const uniqueEmail = `email_${Date.now()}@example.org`;

    registerNewUser({
      username: uniqueHandle,
      displayName: 'Email Login User',
      email: uniqueEmail,
      password: 'EmailPassword456',
    });

    const loginRes = authenticateUser({
      identifier: uniqueEmail,
      password: 'EmailPassword456',
    });

    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.displayName).toBe('Email Login User');
  });

  it('rejects duplicate username registration', () => {
    const duplicateHandle = 'duplicate_' + Date.now().toString(36);
    const email1 = `one_${Date.now()}@example.com`;
    const email2 = `two_${Date.now()}@example.com`;

    const first = registerNewUser({
      username: duplicateHandle,
      displayName: 'First Holder',
      email: email1,
      password: 'password123',
    });
    expect(first.success).toBe(true);

    const second = registerNewUser({
      username: duplicateHandle,
      displayName: 'Duplicate Attempt',
      email: email2,
      password: 'password123',
    });
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already exists/i);
  });

  it('rejects duplicate email registration', () => {
    const sharedEmail = `shared_${Date.now()}@example.com`;
    const handle1 = 'user_a_' + Date.now().toString(36);
    const handle2 = 'user_b_' + Date.now().toString(36);

    const first = registerNewUser({
      username: handle1,
      displayName: 'User A',
      email: sharedEmail,
      password: 'password123',
    });
    expect(first.success).toBe(true);

    const second = registerNewUser({
      username: handle2,
      displayName: 'User B',
      email: sharedEmail,
      password: 'password123',
    });
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already exists/i);
  });

  it('rejects authentication with incorrect password', () => {
    const handle = 'lockuser_' + Date.now().toString(36);
    registerNewUser({
      username: handle,
      displayName: 'Security Tested',
      email: `${handle}@example.com`,
      password: 'CorrectPassword123',
    });

    const res = authenticateUser({
      identifier: handle,
      password: 'WrongPassword999',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/incorrect password/i);
  });

  it('rejects authentication for non-existent account', () => {
    const res = authenticateUser({
      identifier: 'non_existent_ghost_user_99999',
      password: 'AnyPassword',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no account found/i);
  });

  it('validates minimum input constraints on registration', () => {
    // Short username
    const res1 = registerNewUser({
      username: 'ab',
      displayName: 'Short',
      email: 'short@example.com',
      password: 'password123',
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toMatch(/at least 3 characters/i);

    // Invalid email
    const res2 = registerNewUser({
      username: 'validhandle',
      displayName: 'Valid',
      email: 'notanemail',
      password: 'password123',
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toMatch(/valid email/i);

    // Short password
    const res3 = registerNewUser({
      username: 'validhandle2',
      displayName: 'Valid',
      email: 'valid@example.com',
      password: '123',
    });
    expect(res3.success).toBe(false);
    expect(res3.error).toMatch(/at least 6 characters/i);
  });
});
