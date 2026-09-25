export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { safeAuth } from '@/lib/safeAuth';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import { writingProfileTag } from '@/lib/writingProfileCache.js';

const MAX_CONTENT_CHARS = 40_000;
const MAX_FEEDBACK_JSON_CHARS = 500_000;

export async function POST(request) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { type, content, score, feedback, promptText } = body;

    if (type !== 'TASK_1' && type !== 'TASK_2') {
      return NextResponse.json({ error: 'Invalid or missing type' }, { status: 400 });
    }
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json({ error: 'Content is too large' }, { status: 413 });
    }
    if (feedback === undefined || feedback === null) {
      return NextResponse.json({ error: 'Missing feedback' }, { status: 400 });
    }

    const scoreNum = parseFloat(score);
    if (Number.isNaN(scoreNum)) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    let feedbackValue;
    if (typeof feedback === 'string') {
      if (feedback.length > MAX_FEEDBACK_JSON_CHARS) {
        return NextResponse.json({ error: 'Feedback is too large' }, { status: 413 });
      }
      try {
        feedbackValue = JSON.parse(feedback);
      } catch {
        return NextResponse.json({ error: 'Invalid feedback JSON' }, { status: 400 });
      }
    } else {
      try {
        const serialized = JSON.stringify(feedback);
        if (serialized.length > MAX_FEEDBACK_JSON_CHARS) {
          return NextResponse.json({ error: 'Feedback is too large' }, { status: 413 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
      }
      feedbackValue = feedback;
    }

    const prisma = getPrisma();
    const check = await withPrismaRetry(() =>
      prisma.check.create({
        data: {
          type,
          content,
          score: scoreNum,
          feedback: feedbackValue,
          promptText: typeof promptText === 'string' ? promptText.slice(0, MAX_CONTENT_CHARS) : null,
          userId: session.user.id,
        },
      })
    );
    try {
      revalidateTag(writingProfileTag(session.user.id));
    } catch (_) {}

    return NextResponse.json({ ok: true, id: check.id }, { status: 200 });
  } catch (err) {
    console.error('[archive/save]', err);
    return NextResponse.json({ error: 'Could not save to archive' }, { status: 500 });
  }
}
