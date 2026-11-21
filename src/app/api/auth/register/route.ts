import { NextResponse } from 'next/server';
import { RegisterInput, UserAccount, UserRole } from '@/types/auth';
import { registerServerUser, findServerUser } from '@/lib/server-users';

export const runtime = 'edge';

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

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existing = findServerUser(cleanUsername) || findServerUser(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with that username or email already exists.' },
        { status: 409 }
      );
    }

    const avatars = ['🌟', '🦉', '🎨', '🚀', '🌈', '🌻', '💡', '🎵', '⚡', '🌊', '🎙️', '✨'];
    const assignedAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser: UserAccount = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      username: cleanUsername,
      displayName: body.displayName?.trim() || cleanUsername,
      email: cleanEmail,
      avatar: assignedAvatar,
      role: 'member' as UserRole,
      pronouns: body.pronouns?.trim() || undefined,
      bio: body.bio?.trim() || 'VoiceSphere community member.',
      preferredLanguage: body.preferredLanguage || 'en',
      preferredPreset: body.preferredPreset || 'DEFAULT',
      isAacUser: Boolean(body.isAacUser),
      coinsBalance: 100,
      trialDaysLeft: 365,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    const registered = registerServerUser({ ...newUser, passwordHash: body.password });
    if (!registered) {
      return NextResponse.json(
        { error: 'Failed to register account. Username or email taken.' },
        { status: 409 }
      );
    }

    const token = 'vst_' + Math.random().toString(36).substring(2) + '.' + Date.now();

    return NextResponse.json({
      status: 'ok',
      message: 'Account registered successfully.',
      user: newUser,
      token,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing registration.' },
      { status: 500 }
    );
  }
}
