import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SUPPORT_EMAIL } from '@/lib/support';

export const dynamic = 'force-dynamic';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }
    if (name.length > 200 || email.length > 320) {
      return NextResponse.json({ error: 'Name or email is too long.' }, { status: 400 });
    }
    if (message.length > 8000) {
      return NextResponse.json({ error: 'Message is too long (max 8000 characters).' }, { status: 400 });
    }

    const smtpUser = (process.env.EMAIL_USER || '').trim();
    // Align with reminder/cron (EMAIL_PASS); keep EMAIL_PASSWORD for older deploy configs
    const smtpPass = (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '').trim();
    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          error:
            'Feedback delivery is not configured on the server. Please write to us directly using the email in the footer.',
          code: 'FEEDBACK_DISABLED',
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const toAddr = (process.env.EMAIL_FEEDBACK_TO || SUPPORT_EMAIL).trim();

    const subjectSafe = name.replace(/[\r\n]+/g, ' ').slice(0, 120);

    try {
      await transporter.sendMail({
        from: `"STRATUM.ai" <${smtpUser}>`,
        to: toAddr,
        replyTo: email,
        subject: `[STRATUM.ai] Feedback: ${subjectSafe}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; line-height: 1.5;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Message:</strong></p>
            <div style="background:#f1f5f9;padding:16px;border-radius:12px;white-space:pre-wrap;">${escapeHtml(message)}</div>
          </div>
        `,
      });
    } catch (e) {
      const msg = String(e?.message ?? e ?? '');
      const code = String(e?.code ?? '');
      const isAuthError =
        code === 'EAUTH' ||
        /\b535\b/.test(msg) ||
        /badcredentials/i.test(msg) ||
        /username and password not accepted/i.test(msg);
      if (isAuthError) {
        return NextResponse.json(
          {
            error:
              `Feedback email is not configured on the server right now. ` +
              `Please contact us directly at ${SUPPORT_EMAIL}.`,
            code: 'FEEDBACK_EMAIL_AUTH_FAILED',
          },
          { status: 503 }
        );
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/feedback]', e?.message ?? e);
    return NextResponse.json(
      { error: 'Could not send your message. Please try again later or use the email in the site footer.' },
      { status: 500 }
    );
  }
}
