import { NextResponse } from 'next/server';
import { SEED_DEMO_USERS } from '@/lib/auth-store';
import { LoginInput } from '@/types/auth';

export const runtime = 'edge';

const serverEdgeUsers = new Map<string, any>();
SEED_DEMO_USERS.forEach((u) => {
  serverEdgeUsers.set(u.username.toLowerCase(), u);
  serverEdgeUsers.set(u.email.toLowerCase(), u);
});

export async function POST(request: Request) {
  try {
    const body: LoginInput = await request.json();

    if (!body.identifier || !body.password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required.' },
        { status: 400 }
      );
    }

    const idLower = body.identifier.trim().toLowerCase();
    const found = serverEdgeUsers.get(idLower);

    if (!found) {
      return NextResponse.json(
        { error: 'No account found with this username or email.' },
        { status: 404 }
      );
    }

    if (found.passwordHash && found.passwordHash !== body.password && body.password !== 'pass123') {
      return NextResponse.json(
        { error: 'Incorrect password. Try pass123 or select a Demo persona.' },
        { status: 401 }
      );
    }

    const { passwordHash, ...safeUser } = found;
    safeUser.lastLoginAt = Date.now();
    const token = 'vst_' + Math.random().toString(36).substring(2) + '.' + Date.now();

    return NextResponse.json({
      status: 'ok',
      message: 'Login successful.',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process login.' },
      { status: 500 }
    );
  }
}
