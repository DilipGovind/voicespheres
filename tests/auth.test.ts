import { describe, it, expect, beforeEach } from 'vitest';
import {
  SEED_DEMO_USERS,
  getRegisteredUsers,
  registerNewUser,
  authenticateUser,
} from '../src/lib/auth-store';

describe('User Authentication & Registration System', () => {
  it('loads the 5 pre-configured diverse community personas', () => {
    const users = SEED_DEMO_USERS;
    expect(users.length).toBeGreaterThanOrEqual(5);

    const usernames = users.map((u) => u.username);
    expect(usernames).toContain('elena_a11y');
    expect(usernames).toContain('marcus_aac');
    expect(usernames).toContain('amina_voice');
    expect(usernames).toContain('david_sensory');
    expect(usernames).toContain('priya_sharma');

    // Each persona has an avatar, bio, and accessibility preset
    users.forEach((u) => {
      expect(u.avatar.length).toBeGreaterThan(0);
      expect(u.bio).toBeDefined();
      expect(u.coinsBalance).toBeGreaterThan(0);
      expect(u.trialDaysLeft).toBeGreaterThan(0);
    });
  });

  it('authenticates a demo user with valid credentials', () => {
    const res = authenticateUser({
      identifier: 'elena_a11y',
      password: 'pass123',
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.displayName).toBe('Elena Rostova');
    expect(res.user?.preferredPreset).toBe('PRESET_A_BLIND_SCREEN_READER');
  });

  it('authenticates a demo user using email instead of username', () => {
    const res = authenticateUser({
      identifier: 'marcus@voicesphere.org',
      password: 'pass123',
    });

    expect(res.success).toBe(true);
    expect(res.user?.displayName).toBe('Marcus Chen');
    expect(res.user?.isAacUser).toBe(true);
  });

  it('rejects authentication with invalid credentials', () => {
    const res = authenticateUser({
      identifier: 'elena_a11y',
      password: 'wrong_password_999',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/incorrect password/i);
  });

  it('rejects unknown users', () => {
    const res = authenticateUser({
      identifier: 'non_existent_ghost',
      password: 'pass123',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no account found/i);
  });

  it('successfully registers a new user with bonus coins and accessibility settings', () => {
    const uniqueHandle = 'testuser_' + Date.now().toString(36);
    const uniqueEmail = `test_${Date.now()}@example.com`;

    const res = registerNewUser({
      username: uniqueHandle,
      displayName: 'Test Inclusivity Tester',
      email: uniqueEmail,
      password: 'SecurePassword123!',
      pronouns: 'they/them',
      bio: 'Testing voice and AAC tools',
      preferredPreset: 'PRESET_C_AAC_NON_SPEAKING',
      isAacUser: true,
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.username).toBe(uniqueHandle);
    expect(res.user?.displayName).toBe('Test Inclusivity Tester');
    expect(res.user?.coinsBalance).toBe(100); // 100 free bonus coins
    expect(res.user?.trialDaysLeft).toBe(30);
    expect(res.user?.isAacUser).toBe(true);

    // Can log in immediately with new credentials
    const loginRes = authenticateUser({
      identifier: uniqueHandle,
      password: 'SecurePassword123!',
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.id).toBe(res.user?.id);
  });

  it('prevents registering with duplicate username or email', () => {
    const res = registerNewUser({
      username: 'elena_a11y',
      displayName: 'Duplicate Elena',
      email: 'different_elena@example.com',
      password: 'Password123!',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already exists/i);
  });
});
