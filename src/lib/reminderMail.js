import { EMAIL_LEGAL_FOOTER } from '@/lib/support';
import {
  isOutboundMailConfigured,
  sendResendEmail,
} from '@/lib/resendMail';

/**
 * Practice reminder email via Resend (preferred) or Gmail SMTP fallback.
 */
export async function sendPracticeReminderEmail({ to, name, locale }) {
  if (!isOutboundMailConfigured()) {
    console.warn(
      '[reminderMail] RESEND_API_KEY and EMAIL_USER/EMAIL_PASS missing; skip send'
    );
    return { ok: false, reason: 'no_mail' };
  }
  if (!to || !String(to).includes('@')) {
    return { ok: false, reason: 'bad_to' };
  }

  const isRu = locale === 'ru';
  const subject = isRu
    ? 'STRATUM.ai — время тренировки Writing'
    : 'STRATUM.ai — time for your Writing practice';

  const base = (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    ''
  ).replace(/\/+$/, '');
  const greeting = name ? `${name}, ` : '';
  const footer = `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
  const html = isRu
    ? `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
        <p>${greeting}напоминание: короткая сессия IELTS Writing сегодня поможет удержать темп.</p>
        <p><a href="${base}/" style="color:#4f46e5">Открыть Writer</a> · 
        <a href="${base}/study-plan" style="color:#4f46e5">План и аналитика</a></p>
        ${footer}
      </div>`
    : `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
        <p>${greeting}quick reminder: a short IELTS Writing session today helps you stay on track.</p>
        <p><a href="${base}/" style="color:#4f46e5">Open Writer</a> · 
        <a href="${base}/study-plan" style="color:#4f46e5">Study plan</a></p>
        ${footer}
      </div>`;

  return sendResendEmail({ to, subject, html });
}
