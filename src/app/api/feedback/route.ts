import { NextResponse } from 'next/server';
import { getStoredFeedback, submitNewFeedback } from '@/lib/feedback-store';
import { FeedbackInput } from '@/types/feedback';

export const runtime = 'edge';

export async function GET() {
  const items = getStoredFeedback();
  return NextResponse.json({
    status: 'ok',
    total: items.length,
    feedback: items,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body: FeedbackInput = await request.json();

    const result = submitNewFeedback(body);
    if (!result.success || !result.item) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit feedback.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Thank you! Your feedback has been received and added to community reviews.',
      item: result.item,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing feedback.' },
      { status: 500 }
    );
  }
}
