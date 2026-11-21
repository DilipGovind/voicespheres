import { NextResponse } from 'next/server';
import { getAllServerUsers } from '@/lib/server-users';

export const runtime = 'edge';

export async function GET() {
  const safeUsers = getAllServerUsers();

  return NextResponse.json({
    status: 'ok',
    totalUsers: safeUsers.length,
    users: safeUsers,
    timestamp: Date.now(),
  });
}
