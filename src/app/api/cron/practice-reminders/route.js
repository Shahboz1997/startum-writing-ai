export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getZonedParts, zonedDateKey } from '@/lib/zonedTime';
import { sendPracticeReminderEmail } from '@/lib/reminderMail';
import { verifyCronRequest } from '@/lib/cronAuth';
import { isOutboundMailConfigured } from '@/lib/resendMail';

function parseDaySet(s) {
  if (typeof s !== 'string' || !s.trim()) return new Set([1, 2, 3, 4, 5]);
  const nums = s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  return new Set(nums.length ? nums : [1, 2, 3, 4, 5]);
}

/** True when local scheduled time has already passed today (evening cron sends same day). */
function isReminderDue(parts, hour, minute) {
  const now = parts.hour * 60 + parts.minute;
  const tgt = hour * 60 + minute;
  return now >= tgt;
}

/**
 * Practice reminder cron — single entry point (see vercel.json).
 *
 * Auth: Authorization: Bearer <CRON_SECRET> only.
 * Hobby plan: cron runs once per day (18:00 UTC). Sends if local scheduled time has passed.
 */
export async function GET(request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) return auth.response;

  if (!isOutboundMailConfigured()) {
    console.warn('[cron/practice-reminders] email not configured; skip');
    return NextResponse.json(
      { ok: false, error: 'RESEND_API_KEY or EMAIL_USER/EMAIL_PASS required' },
      { status: 503 }
    );
  }

  const prisma = getPrisma();
  const now = new Date();
  let sentEmail = 0;
  let skipped = 0;
  let failed = 0;

  const users = await prisma.user.findMany({
    where: { practiceRemindersEnabled: true },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
      practiceRemindersEnabled: true,
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
    if (!isReminderDue(parts, u.practiceReminderHour ?? 19, u.practiceReminderMinute ?? 0)) {
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

    const locale = u.language === 'ru' ? 'ru' : 'en';

    if (u.email && String(u.email).includes('@')) {
      const res = await sendPracticeReminderEmail({
        to: u.email,
        name: u.name,
        locale,
      });
      if (res.ok) {
        sentEmail++;
        await prisma.user.update({
          where: { id: u.id },
          data: { practiceReminderLastSent: now },
        });
      } else {
        failed++;
        console.warn('[cron/practice-reminders] email failed', u.id, u.email, res.reason || 'unknown');
      }
    } else {
      skipped++;
    }
  }

  const summary = {
    ok: true,
    checked: users.length,
    sentEmail,
    skipped,
    failed,
  };
  console.log('[cron/practice-reminders]', summary);
  return NextResponse.json(summary);
}
