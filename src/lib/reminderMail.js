import nodemailer from 'nodemailer';

/**
 * Sends practice reminder email. Requires EMAIL_USER + EMAIL_PASS (e.g. Gmail app password) in env.
 */
export async function sendPracticeReminderEmail({ to, name, locale }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.warn('[reminderMail] EMAIL_USER or EMAIL_PASS missing; skip send');
    return { ok: false, reason: 'no_smtp' };
  }
  if (!to || !String(to).includes('@')) {
    return { ok: false, reason: 'bad_to' };
  }

  const isRu = locale === 'ru';
  const subject = isRu
    ? 'STRATUM.ai — время тренировки Writing'
    : 'STRATUM.ai — time for your Writing practice';

  const greeting = name ? `${name}, ` : '';
  const html = isRu
    ? `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
        <p>${greeting}напоминание: короткая сессия IELTS Writing сегодня поможет удержать темп.</p>
        <p><a href="${process.env.NEXTAUTH_URL || ''}/" style="color:#4f46e5">Открыть Writer</a> · 
        <a href="${process.env.NEXTAUTH_URL || ''}/study-plan" style="color:#4f46e5">План и аналитика</a></p>
      </div>`
    : `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
        <p>${greeting}quick reminder: a short IELTS Writing session today helps you stay on track.</p>
        <p><a href="${process.env.NEXTAUTH_URL || ''}/" style="color:#4f46e5">Open Writer</a> · 
        <a href="${process.env.NEXTAUTH_URL || ''}/study-plan" style="color:#4f46e5">Study plan</a></p>
      </div>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: user,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error('[reminderMail]', err?.message || err);
    return { ok: false, reason: err?.message || 'send_failed' };
  }
}
