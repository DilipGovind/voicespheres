import { NextResponse } from 'next/server';
import { SEED_DEMO_USERS } from '@/lib/auth-store';

export const runtime = 'edge';

export async function GET() {
  // Return the public demo accounts and registered user list without sensitive password hashes
  const safeUsers = SEED_DEMO_USERS.map(({ passwordHash, ...user }) => user);

  return NextResponse.json({
    status: 'ok',
    totalUsers: safeUsers.length,
    users: safeUsers,
    timestamp: Date.now(),
  });
}
