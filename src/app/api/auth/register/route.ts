import { NextResponse } from 'next/server';
import { SEED_DEMO_USERS, registerNewUser } from '@/lib/auth-store';
import { RegisterInput } from '@/types/auth';

export const runtime = 'edge';

// Edge-safe in-memory registry for serverless instances
const serverEdgeUsers = new Map<string, any>();
SEED_DEMO_USERS.forEach((u) => {
  serverEdgeUsers.set(u.username.toLowerCase(), u);
  serverEdgeUsers.set(u.email.toLowerCase(), u);
});

export async function POST(request: Request) {
  try {
    const body: RegisterInput = await request.json();

    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = body.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = body.email.trim().toLowerCase();

    if (serverEdgeUsers.has(cleanUsername) || serverEdgeUsers.has(cleanEmail)) {
      return NextResponse.json(
        { error: 'An account with that username or email already exists.' },
        { status: 409 }
      );
    }

    const avatars = ['🌟', '🦉', '🎨', '🚀', '🌈', '🌻', '💡', '🎵', '⚡', '🌊'];
    const assignedAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      username: cleanUsername,
      displayName: body.displayName?.trim() || cleanUsername,
      email: cleanEmail,
      avatar: assignedAvatar,
      role: 'member' as const,
      pronouns: body.pronouns?.trim() || undefined,
      bio: body.bio?.trim() || 'New VoiceSphere community member.',
      preferredLanguage: body.preferredLanguage || 'en',
      preferredPreset: body.preferredPreset || 'DEFAULT',
      isAacUser: Boolean(body.isAacUser),
      coinsBalance: 100,
      trialDaysLeft: 30,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    serverEdgeUsers.set(cleanUsername, { ...newUser, passwordHash: body.password });
    serverEdgeUsers.set(cleanEmail, { ...newUser, passwordHash: body.password });

    const token = 'vst_' + Math.random().toString(36).substring(2) + '.' + Date.now();

    return NextResponse.json({
      status: 'ok',
      message: 'Account registered successfully.',
      user: newUser,
      token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process registration.' },
      { status: 500 }
    );
  }
}
