export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPrisma } from '@/lib/prisma';

export async function POST(request) {
  const session = await auth();
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
  if (feedback === undefined || feedback === null) {
    return NextResponse.json({ error: 'Missing feedback' }, { status: 400 });
  }

  const scoreNum = parseFloat(score);
  if (Number.isNaN(scoreNum)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  const feedbackStr =
    typeof feedback === 'string' ? feedback : JSON.stringify(feedback);

  const prisma = getPrisma();
  const check = await prisma.check.create({
    data: {
      type,
      content,
      score: scoreNum,
      feedback: feedbackStr,
      promptText: typeof promptText === 'string' ? promptText : null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: check.id }, { status: 200 });
}
