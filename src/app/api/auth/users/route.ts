import { NextResponse } from 'next/server';
import { getAllServerUsers, registerServerUser, ServerUserRecord } from '@/lib/server-users';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.users && Array.isArray(body.users)) {
      body.users.forEach((u: ServerUserRecord) => {
        if (u && u.id && u.username) {
          registerServerUser(u);
        }
      });
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
