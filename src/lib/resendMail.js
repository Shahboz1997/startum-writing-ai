import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { EMAIL_LEGAL_FOOTER, SUPPORT_EMAIL } from '@/lib/support';
import { parseAdminEmails } from '@/lib/admin';

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function getResendClient() {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  const from = (process.env.RESEND_FROM || '').trim();
  if (from) return from;
  // Resend onboarding sender works for tests; production should set RESEND_FROM.
  return 'STRATUM.ai <onboarding@resend.dev>';
}

function isSmtpConfigured() {
  return Boolean(
    (process.env.EMAIL_USER || '').trim() && (process.env.EMAIL_PASS || '').trim()
  );
}

function normalizeRecipients(to) {
  const list = Array.isArray(to)
    ? to
    : typeof to === 'string'
      ? [to]
      : [];
  return [
    ...new Set(
      list
        .map((e) => String(e || '').trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    ),
  ];
}

function footerHtml() {
  return `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
}

function extractResendTestingOwner(message) {
  const m = String(message || '').match(
    /your own email address\s*\(([^)]+)\)/i
  );
  const email = m?.[1]?.trim().toLowerCase();
  return email && EMAIL_RE.test(email) ? email : null;
}

async function sendViaSmtp({ to, subject, html, replyTo }) {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) {
    return { ok: false, reason: 'no_smtp' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    const info = await transporter.sendMail({
      from: `STRATUM.ai <${user}>`,
      to: to.join(', '),
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { ok: true, id: info.messageId, via: 'smtp' };
  } catch (err) {
    console.error('[resendMail/smtp]', err?.message || err);
    return { ok: false, reason: err?.message || 'smtp_failed' };
  }
}

async function sendViaResend(resend, { to, subject, html, replyTo }) {
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) {
    return { ok: false, reason: error.message || 'send_failed', error };
  }
  return { ok: true, id: data?.id, via: 'resend' };
}

/**
 * Prefer Resend; if onboarding@resend.dev blocks non-owner recipients,
 * retry to the Resend account owner; then fall back to Gmail SMTP.
 */
export async function sendResendEmail({ to, subject, html, replyTo }) {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    return { ok: false, reason: 'bad_to' };
  }
  if (!subject || !html) {
    return { ok: false, reason: 'bad_input' };
  }

  const payload = { subject, html, replyTo };
  const resend = getResendClient();
  let lastReason = resend ? null : 'no_resend';
  let delivered = null;
  let testingOwner = null;

  if (resend) {
    try {
      const primary = await sendViaResend(resend, { ...payload, to: recipients });
      if (primary.ok) {
        delivered = primary;
      } else {
        lastReason = primary.reason;
        console.error('[resendMail]', primary.error || primary.reason);

        testingOwner = extractResendTestingOwner(primary.reason);
        if (testingOwner) {
          const retry = await sendViaResend(resend, {
            ...payload,
            to: [testingOwner],
          });
          if (retry.ok) {
            console.warn(
              `[resendMail] Resend testing domain: notified account owner ${testingOwner} (requested: ${recipients.join(', ')})`
            );
            delivered = { ...retry, via: 'resend_testing_owner' };
          } else {
            lastReason = retry.reason || lastReason;
            console.error(
              '[resendMail] owner retry failed',
              retry.error || retry.reason
            );
          }
        }
      }
    } catch (err) {
      lastReason = err?.message || 'send_failed';
      console.error('[resendMail]', lastReason);
    }
  }

  // SMTP: full delivery, or secondary inbox when Resend only reached the account owner.
  if (isSmtpConfigured() && (!delivered || delivered.via === 'resend_testing_owner')) {
    const smtp = await sendViaSmtp({ ...payload, to: recipients });
    if (smtp.ok) {
      if (delivered) {
        return {
          ok: true,
          id: delivered.id,
          via: 'resend_and_smtp',
          smtpId: smtp.id,
        };
      }
      console.warn('[resendMail] delivered via SMTP fallback:', lastReason);
      return smtp;
    }
    if (!delivered) {
      return {
        ok: false,
        reason: smtp.reason || lastReason || 'send_failed',
      };
    }
    console.warn(
      '[resendMail/smtp] secondary delivery to ADMIN_EMAILS failed:',
      smtp.reason
    );
  }

  if (delivered) return delivered;
  return { ok: false, reason: lastReason || 'no_mail' };
}

export function isResendConfigured() {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
}

/** True when either Resend or Gmail SMTP can deliver outbound mail. */
export function isOutboundMailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

/** @deprecated Prefer isOutboundMailConfigured — same check. */
export function isDepositMailConfigured() {
  return isOutboundMailConfigured();
}

/**
 * Notify admins that a user claimed they paid for a credit pack.
 */
export async function sendDepositPaidAdminEmail(deposit) {
  const admins = parseAdminEmails().filter((e) => EMAIL_RE.test(e));
  const to = admins.length > 0 ? admins : [SUPPORT_EMAIL];

  const subject = `[STRATUM] Deposit claimed — ${deposit.packName} (${deposit.credits} credits) · ${deposit.userEmail}`;
  const noteBlock = deposit.note
    ? `<p><strong>User note:</strong> ${escapeHtml(deposit.note)}</p>`
    : '';

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5">
    <p>A user marked a credit pack as paid. Verify the Visa / bank transfer, then credit their account.</p>
    <ul>
      <li><strong>Deposit ID:</strong> ${escapeHtml(deposit.id)}</li>
      <li><strong>User:</strong> ${escapeHtml(deposit.userEmail)} (id: ${escapeHtml(deposit.userId)})</li>
      <li><strong>Pack:</strong> ${escapeHtml(deposit.packName)} (${deposit.credits} credits)</li>
      <li><strong>Amount:</strong> $${Number(deposit.amountUsd).toFixed(2)} ${escapeHtml(deposit.currency || 'USD')}</li>
      <li><strong>Status:</strong> ${escapeHtml(deposit.status)}</li>
    </ul>
    ${noteBlock}
    <p style="color:#6b7280;font-size:13px">
      Credit via <code>POST /api/admin/credits</code> with
      <code>{"email":"${escapeHtml(deposit.userEmail)}","increment":${deposit.credits},"depositId":"${escapeHtml(deposit.id)}"}</code>
      (admin session required).
    </p>
    ${footerHtml()}
  </div>`;

  return sendResendEmail({
    to,
    subject,
    html,
    replyTo: deposit.userEmail,
  });
}

/**
 * Tell the user their credits were added after manual verification.
 */
export async function sendDepositCreditedUserEmail({ to, name, packName, credits, newBalance }) {
  const greeting = name ? `${escapeHtml(name)}, ` : '';
  const subject = `STRATUM.ai — ${credits} credits added (${packName})`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
    <p>${greeting}your payment was verified. We added <strong>${credits}</strong> credits (${escapeHtml(packName)}).</p>
    <p>Your balance is now <strong>${newBalance}</strong> credits. Open the Writer to continue analyzing essays.</p>
    <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or write ${SUPPORT_EMAIL}.</p>
    ${footerHtml()}
  </div>`;

  return sendResendEmail({ to, subject, html, replyTo: SUPPORT_EMAIL });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
