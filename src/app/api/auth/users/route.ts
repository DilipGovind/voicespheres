import { NextResponse } from 'next/server';
import { getRegisteredUsers } from '@/lib/auth-store';

export const runtime = 'edge';

export async function GET() {
  const users = getRegisteredUsers();
  const safeUsers = users.map(({ passwordHash, ...user }) => user);

  return NextResponse.json({
    status: 'ok',
    totalUsers: safeUsers.length,
    users: safeUsers,
    timestamp: Date.now(),
  });
}
