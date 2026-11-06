import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'VoiceSphere',
    version: '1.0.0',
    status: 'healthy',
    wcagCompliance: 'WCAG 2.2 AA / AAA',
    platform: 'Online Vercel Serverless & Self-Hosted WebRTC',
    timestamp: new Date().toISOString(),
  });
}
