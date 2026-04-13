export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPrisma } from '@/lib/prisma';

function parseDays(s) {
  if (typeof s !== 'string' || !s.trim()) return [1, 2, 3, 4, 5];
  const parts = s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  return parts.length ? parts : [1, 2, 3, 4, 5];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const prisma = getPrisma();
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        practiceRemindersEnabled: true,
        practiceReminderHour: true,
        practiceReminderMinute: true,
        practiceReminderTimezone: true,
        practiceReminderDays: true,
      },
    });
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(u);
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const enabled = body.practiceRemindersEnabled;
  const hour = body.practiceReminderHour;
  const minute = body.practiceReminderMinute;
  const tz = body.practiceReminderTimezone;
  const days = body.practiceReminderDays;

  const data = {};
  if (typeof enabled === 'boolean') data.practiceRemindersEnabled = enabled;
  if (hour != null) {
    const h = parseInt(hour, 10);
    if (Number.isNaN(h) || h < 0 || h > 23) {
      return NextResponse.json({ error: 'practiceReminderHour must be 0–23' }, { status: 400 });
    }
    data.practiceReminderHour = h;
  }
  if (minute != null) {
    const m = parseInt(minute, 10);
    if (Number.isNaN(m) || m < 0 || m > 59) {
      return NextResponse.json({ error: 'practiceReminderMinute must be 0–59' }, { status: 400 });
    }
    data.practiceReminderMinute = m;
  }
  if (typeof tz === 'string' && tz.trim().length > 0) {
    data.practiceReminderTimezone = tz.trim().slice(0, 64);
  }
  if (days != null) {
    if (Array.isArray(days)) {
      const arr = days.map((d) => parseInt(d, 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
      if (!arr.length) return NextResponse.json({ error: 'practiceReminderDays invalid' }, { status: 400 });
      data.practiceReminderDays = arr.join(',');
    } else if (typeof days === 'string') {
      const arr = parseDays(days);
      data.practiceReminderDays = arr.join(',');
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const u = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        practiceRemindersEnabled: true,
        practiceReminderHour: true,
        practiceReminderMinute: true,
        practiceReminderTimezone: true,
        practiceReminderDays: true,
      },
    });
    return NextResponse.json(u);
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
