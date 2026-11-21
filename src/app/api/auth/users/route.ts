import { NextResponse } from 'next/server';
import {
  getAllServerUsers,
  registerServerUserAsync,
  ServerUserRecord,
  ensureUsersHydrated,
} from '@/lib/server-users';

export const runtime = 'edge';

export async function GET() {
  await ensureUsersHydrated();
  const safeUsers = getAllServerUsers();

  return NextResponse.json({
    status: 'ok',
    totalUsers: safeUsers.length,
    users: safeUsers,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureUsersHydrated();

    if (body.users && Array.isArray(body.users)) {
      for (const u of body.users) {
        if (u && u.id && u.username) {
          await registerServerUserAsync(u);
        }
      }
    }

    const safeUsers = getAllServerUsers();
    return NextResponse.json({
      status: 'ok',
      totalUsers: safeUsers.length,
      users: safeUsers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sync error' }, { status: 500 });
  }
}
