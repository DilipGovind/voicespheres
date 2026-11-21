import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    name: 'VoiceSphere',
    version: '1.0.0',
    status: 'healthy',
    wcagCompliance: 'WCAG 2.2 AA / AAA',
    platform: 'Cloudflare Pages Edge & WebRTC Voice',
    timestamp: new Date().toISOString(),
  });
}
