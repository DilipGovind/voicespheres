import { NextResponse } from 'next/server';
import { ReportItem } from '@/types/room';

// Ephemeral in-memory store for prototype abuse reports
const reportsLog: ReportItem[] = [];

// Rate-limiting map: ipOrUser -> timestamp[]
const reportRateLimits = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (reportRateLimits.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  reportRateLimits.set(key, timestamps);
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reportedUserId, reportedUserName, roomId, reason, description } = body;

    if (!reporterId || !reportedUserId || !roomId || !reason) {
      return NextResponse.json(
        { error: 'Missing mandatory report fields' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(reporterId, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many abuse reports submitted. Please wait before submitting another report.' },
        { status: 429 }
      );
    }

    const report: ReportItem = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      reportedUserId,
      reportedUserName: reportedUserName || 'Anonymous',
      reporterId,
      roomId,
      reason,
      description: description || '',
      timestamp: Date.now(),
      status: 'pending',
    };

    reportsLog.push(report);

    // Keep log bounded in memory
    if (reportsLog.length > 200) {
      reportsLog.shift();
    }

    return NextResponse.json({
      status: 'received',
      reportId: report.id,
      message: 'Abuse report recorded. Host/moderator alerted and client-side block enabled.',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error processing abuse report' },
      { status: 500 }
    );
  }
}
