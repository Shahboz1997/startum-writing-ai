export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getZonedParts, zonedDateKey } from '@/lib/zonedTime';
import { sendPracticeReminderEmail } from '@/lib/reminderMail';

function parseDaySet(s) {
  if (typeof s !== 'string' || !s.trim()) return new Set([1, 2, 3, 4, 5]);
  const nums = s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  return new Set(nums.length ? nums : [1, 2, 3, 4, 5]);
}

function inReminderWindow(parts, hour, minute) {
  const now = parts.hour * 60 + parts.minute;
  const tgt = hour * 60 + minute;
  return now >= tgt && now <= tgt + 25;
}

/**
 * Vercel Cron: protect with CRON_SECRET (Authorization: Bearer …).
 *
 * Hobby plan: cron may run at most once per day — frequent schedules fail deployment.
 * vercel.json uses one daily run (UTC). For sub-hourly checks, upgrade to Pro or call this URL from an external cron.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const q = request.nextUrl.searchParams.get('secret');
  // Vercel Cron calls this endpoint without custom headers/query.
  // It sets `x-vercel-cron: 1`, so we can trust that in production.
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const ok =
    isVercelCron ||
    (secret && (authHeader === `Bearer ${secret}` || (q && q === secret)));
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  const now = new Date();
  let sent = 0;
  let skipped = 0;

  const users = await prisma.user.findMany({
    where: { practiceRemindersEnabled: true },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
      practiceReminderHour: true,
      practiceReminderMinute: true,
      practiceReminderTimezone: true,
      practiceReminderDays: true,
      practiceReminderLastSent: true,
    },
  });

  for (const u of users) {
    const tz = u.practiceReminderTimezone || 'UTC';
    const parts = getZonedParts(now, tz);
    const days = parseDaySet(u.practiceReminderDays);
    if (!days.has(parts.weekday)) {
      skipped++;
      continue;
    }
    if (!inReminderWindow(parts, u.practiceReminderHour ?? 19, u.practiceReminderMinute ?? 0)) {
      skipped++;
      continue;
    }
    const todayKey = zonedDateKey(now, tz);
    if (u.practiceReminderLastSent) {
      const lastKey = zonedDateKey(u.practiceReminderLastSent, tz);
      if (lastKey === todayKey) {
        skipped++;
        continue;
      }
    }

    const res = await sendPracticeReminderEmail({
      to: u.email,
      name: u.name,
      locale: u.language === 'ru' ? 'ru' : 'en',
    });
    if (res.ok) {
      await prisma.user.update({
        where: { id: u.id },
        data: { practiceReminderLastSent: now },
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, checked: users.length });
}
