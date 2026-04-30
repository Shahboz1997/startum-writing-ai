export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import moment from "moment-timezone";
import { getPrisma } from "@/lib/prisma";

type ReminderUser = {
  id: string;
  email: string;
  name: string | null;
  language: string | null;
  practiceReminderHour: number | null;
  practiceReminderMinute: number | null;
  practiceReminderTimezone: string | null;
  practiceReminderDays: string | null;
  practiceReminderLastSent?: Date | null;
};

function parseDaySet(s: string | null | undefined): Set<number> {
  if (typeof s !== "string" || !s.trim()) return new Set([1, 2, 3, 4, 5]);
  const nums = s
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);
  return new Set(nums.length ? nums : [1, 2, 3, 4, 5]);
}

function isInWindow(params: {
  now: moment.Moment;
  hour: number;
  minute: number;
  windowMinutes: number;
}): boolean {
  const scheduled = params.now
    .clone()
    .hour(params.hour)
    .minute(params.minute)
    .second(0)
    .millisecond(0);
  const diffMinutes = params.now.diff(scheduled, "minutes", true);
  return diffMinutes >= 0 && diffMinutes < params.windowMinutes;
}

function isSameLocalDay(params: {
  a: Date;
  b: Date;
  tz: string;
}): boolean {
  const fmt = "YYYY-MM-DD";
  return (
    moment(params.a).tz(params.tz).format(fmt) ===
    moment(params.b).tz(params.tz).format(fmt)
  );
}

function buildReminderEmail(params: {
  to: string;
  name?: string | null;
  locale: "ru" | "en";
}) {
  const appUrl = process.env.NEXTAUTH_URL || "";
  const greeting =
    params.locale === "ru"
      ? params.name
        ? `Привет, ${escapeHtml(params.name)}!`
        : "Привет!"
      : params.name
        ? `Hi ${escapeHtml(params.name)},`
        : "Hi,";

  const subject =
    params.locale === "ru"
      ? "STRATUM.ai — время потренироваться IELTS Writing"
      : "STRATUM.ai — time for your IELTS Writing practice";

  const ctaText = params.locale === "ru" ? "Открыть Writer" : "Open Writer";
  const bodyText =
    params.locale === "ru"
      ? "Короткая сессия Writing сегодня поможет удержать темп."
      : "A short Writing session today helps you stay on track.";

  const footer =
    'STRATUM LLC, 30 N Gould St Ste R, Sheridan, WY 82801, USA';

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;line-height:1.55">
      <p style="margin:0 0 12px">${greeting}</p>
      <p style="margin:0 0 16px">${bodyText}</p>
      <p style="margin:0 0 20px">
        <a href="${escapeAttr(appUrl || "/")}" style="color:#4f46e5;text-decoration:none;font-weight:600">${ctaText}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0" />
      <p style="margin:0;color:#6b7280;font-size:12px">${footer}</p>
    </div>
  `;

  return { subject, html };
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  const ok = Boolean(secret) && auth === `Bearer ${secret}`;
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.log("[cron/send-reminders] EMAIL_USER/EMAIL_PASS missing; skip");
    return NextResponse.json(
      { ok: false, error: "EMAIL_USER/EMAIL_PASS missing" },
      { status: 500 },
    );
  }

  const prisma = getPrisma();
  const nowUtc = new Date();

  const users = (await prisma.user.findMany({
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
  })) as ReminderUser[];

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    const tz = u.practiceReminderTimezone || "UTC";
    const now = moment(nowUtc).tz(tz);
    const weekday = now.day(); // 0=Sun … 6=Sat

    const days = parseDaySet(u.practiceReminderDays);
    if (!days.has(weekday)) {
      skipped++;
      continue;
    }

    const hour = u.practiceReminderHour ?? 19;
    const minute = u.practiceReminderMinute ?? 0;

    if (!isInWindow({ now, hour, minute, windowMinutes: 15 })) {
      skipped++;
      continue;
    }

    if (u.practiceReminderLastSent && isSameLocalDay({ a: u.practiceReminderLastSent, b: nowUtc, tz })) {
      skipped++;
      continue;
    }

    if (!u.email || !u.email.includes("@")) {
      skipped++;
      continue;
    }

    const locale: "ru" | "en" = u.language === "ru" ? "ru" : "en";
    const { subject, html } = buildReminderEmail({
      to: u.email,
      name: u.name,
      locale,
    });

    try {
      await transporter.sendMail({
        from: `STRATUM.ai <${user}>`,
        to: u.email,
        subject,
        html,
      });
      await prisma.user.update({
        where: { id: u.id },
        data: { practiceReminderLastSent: nowUtc },
      });
      sent++;
    } catch (err: unknown) {
      failed++;
      console.log(
        "[cron/send-reminders] send failed",
        u.id,
        u.email,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  console.log("[cron/send-reminders]", {
    checked: users.length,
    sent,
    skipped,
    failed,
  });

  return NextResponse.json({ ok: true, checked: users.length, sent, skipped, failed });
}

