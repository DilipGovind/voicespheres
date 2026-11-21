import { describe, it, expect } from 'vitest';
import {
  registerServerUser,
  findServerUser,
  getAllServerUsers,
  INITIAL_COMMUNITY_USERS,
} from '../src/lib/server-users';
import { realtimeClient } from '../src/lib/socket-client';

describe('Cross-Device User Data & Sync Architecture', () => {
  it('pre-populates server registry with diverse community accounts', () => {
    const all = getAllServerUsers();
    expect(all.length).toBeGreaterThanOrEqual(INITIAL_COMMUNITY_USERS.length);
    expect(all.some((u) => u.username === 'marcus_aac')).toBe(true);
    expect(all.some((u) => u.username === 'elena_a11y')).toBe(true);
  });

  it('allows registering a user on Device A and locating that user on Device B', () => {
    const uniqueUsername = 'cross_dev_' + Date.now().toString(36);
    const uniqueEmail = `cross_${Date.now()}@voicesphere.org`;

    // Device A registers
    const registered = registerServerUser({
      id: 'user_' + uniqueUsername,
      username: uniqueUsername,
      displayName: 'Cross Device Tester',
      email: uniqueEmail,
      passwordHash: 'SuperSafe123!',
      avatar: '🚀',
      role: 'member',
      coinsBalance: 100,
      trialDaysLeft: 365,
      createdAt: Date.now(),
    });

    expect(registered).toBe(true);

    // Device B searches by username
    const foundByUsername = findServerUser(uniqueUsername);
    expect(foundByUsername).toBeDefined();
    expect(foundByUsername?.displayName).toBe('Cross Device Tester');
    expect(foundByUsername?.passwordHash).toBe('SuperSafe123!');

    // Device B searches by email
    const foundByEmail = findServerUser(uniqueEmail);
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail?.id).toBe(foundByUsername?.id);

    // Appears in server user list for cross-device hydration
    const allUsers = getAllServerUsers();
    expect(allUsers.some((u) => u.username === uniqueUsername)).toBe(true);
  });

  it('receives real-time broadcast events when another device registers or submits feedback', () => {
    let capturedUser: any = null;
    let capturedFeedback: any = null;

    const unsubUser = realtimeClient.on('global:user_registered', (payload) => {
      capturedUser = payload?.user || payload;
    });

    const unsubFeedback = realtimeClient.on('global:feedback_submitted', (payload) => {
      capturedFeedback = payload?.feedback || payload;
    });

    // Simulate Device A emitting events
    realtimeClient.broadcastUserRegistered({
      id: 'user_remote_1',
      username: 'remote_anna',
      displayName: 'Anna Remote',
      email: 'anna@example.com',
    });

    realtimeClient.broadcastFeedbackSubmitted({
      id: 'fb_remote_1',
      title: 'Works across both laptops',
      rating: 5,
    });

    expect(capturedUser).not.toBeNull();
    expect(capturedUser.username).toBe('remote_anna');

    expect(capturedFeedback).not.toBeNull();
    expect(capturedFeedback.title).toBe('Works across both laptops');

    unsubUser();
    unsubFeedback();
  });
});
