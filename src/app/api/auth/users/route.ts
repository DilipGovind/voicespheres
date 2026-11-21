import { NextResponse } from 'next/server';
import {
  getAllServerUsers,
  registerServerUser,
  ServerUserRecord,
  serverUsersMap,
  getCloudflareKv,
} from '@/lib/server-users';

export const runtime = 'edge';

export async function GET() {
  // Hydrate custom registered users from Cloudflare KV if bound
  try {
    const kv = await getCloudflareKv();
    if (kv) {
      const raw = await kv.get('community_users');
      if (raw) {
        const customUsers = JSON.parse(raw);
        if (Array.isArray(customUsers)) {
          customUsers.forEach((u: ServerUserRecord) => {
            if (u && u.id && u.username) {
              serverUsersMap.set(u.id, u);
              serverUsersMap.set(u.username.toLowerCase(), u);
              if (u.email) serverUsersMap.set(u.email.toLowerCase(), u);
            }
          });
        }
      }
    }
  } catch {}

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
