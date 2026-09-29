import { getPrisma } from "@/lib/prisma";
import { ensureAuthPublicUrl } from "@/lib/ensureAuthPublicUrl";
import { EMAIL_LEGAL_FOOTER } from "@/lib/support";
import {
  isOutboundMailConfigured,
  sendResendEmail,
} from "@/lib/resendMail";
import crypto from "node:crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getSiteOrigin() {
  ensureAuthPublicUrl();
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export async function createEmailVerificationToken(email) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  const prisma = getPrisma();

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalized },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token,
      expires,
    },
  });

  return rawToken;
}

export async function sendVerificationEmail({ to, name, token }) {
  if (!isOutboundMailConfigured()) {
    console.warn(
      "[emailVerification] RESEND_API_KEY and EMAIL_USER/EMAIL_PASS missing; skip send"
    );
    return { ok: false, reason: "no_mail" };
  }
  if (!to || !String(to).includes("@") || !token) {
    return { ok: false, reason: "bad_input" };
  }

  const verifyUrl = `${getSiteOrigin()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = name ? `${name}, ` : "";
  const footer = `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
    <p>${greeting}confirm your email to activate your STRATUM.ai account.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Confirm email</a></p>
    <p style="color:#6b7280;font-size:13px">Or copy this link:<br><a href="${verifyUrl}" style="color:#4f46e5;word-break:break-all">${verifyUrl}</a></p>
    <p style="color:#6b7280;font-size:13px">This link expires in 24 hours.</p>
    ${footer}
  </div>`;

  const sent = await sendResendEmail({
    to,
    subject: "STRATUM.ai — confirm your email",
    html,
  });
  if (!sent.ok) {
    console.error("[emailVerification]", sent.reason);
    return sent;
  }
  // Testing domain only reaches the Resend account owner — not the registrant.
  if (sent.via === "resend_testing_owner") {
    console.warn(
      "[emailVerification] Resend testing domain did not deliver to recipient"
    );
    return { ok: false, reason: "testing_domain_blocked" };
  }
  return sent;
}

export async function verifyEmailToken(rawToken) {
  const token = hashToken(rawToken);
  const prisma = getPrisma();

  const row = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!row) {
    return { ok: false, error: "invalid" };
  }

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { ok: false, error: "expired" };
  }

  const email = row.identifier;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { ok: false, error: "invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  const loginToken = await createOneTimeLoginToken(email, "post-verify-login");
  return { ok: true, email, loginToken };
}

const POST_VERIFY_LOGIN_PREFIX = "post-verify-login:";
const MAGIC_LOGIN_PREFIX = "magic-login:";
const ONE_TIME_LOGIN_TTL_MS = 15 * 60 * 1000;

/**
 * @param {string} email
 * @param {'post-verify-login' | 'magic-login'} [kind]
 */
export async function createOneTimeLoginToken(email, kind = "post-verify-login") {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) return null;

  const prefix =
    kind === "magic-login" ? MAGIC_LOGIN_PREFIX : POST_VERIFY_LOGIN_PREFIX;
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + ONE_TIME_LOGIN_TTL_MS);
  const prisma = getPrisma();
  const identifier = `${prefix}${normalized}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return rawToken;
}

/** @deprecated Use createOneTimeLoginToken(email, 'post-verify-login') */
export async function createPostVerifyLoginToken(email) {
  return createOneTimeLoginToken(email, "post-verify-login");
}

/**
 * Consume a one-time login token (post-verify or magic link).
 * Magic-link click also marks emailVerified — proves mailbox access.
 */
export async function consumeOneTimeLoginToken(rawToken) {
  const token = hashToken(rawToken);
  const prisma = getPrisma();
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  const id = String(row?.identifier || "");

  const isPostVerify = id.startsWith(POST_VERIFY_LOGIN_PREFIX);
  const isMagic = id.startsWith(MAGIC_LOGIN_PREFIX);
  if (!row || (!isPostVerify && !isMagic)) {
    return null;
  }

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return null;
  }

  const prefix = isMagic ? MAGIC_LOGIN_PREFIX : POST_VERIFY_LOGIN_PREFIX;
  const email = id.slice(prefix.length);
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    language: user.language || "en",
  };
}

/** @deprecated Use consumeOneTimeLoginToken */
export async function consumePostVerifyLoginToken(rawToken) {
  return consumeOneTimeLoginToken(rawToken);
}

export async function sendMagicLinkEmail({ to, name, loginToken }) {
  if (!isOutboundMailConfigured()) {
    return { ok: false, reason: "no_mail" };
  }
  if (!to || !loginToken) return { ok: false, reason: "bad_input" };

  const loginUrl = `${getSiteOrigin()}/?app=1&loginToken=${encodeURIComponent(loginToken)}`;
  const greeting = name ? `${name}, ` : "";
  const footer = `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
    <p>${greeting}use this link to sign in to STRATUM.ai — no password needed.</p>
    <p><a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Sign in to STRATUM</a></p>
    <p style="color:#6b7280;font-size:13px">Or copy this link:<br><a href="${loginUrl}" style="color:#4f46e5;word-break:break-all">${loginUrl}</a></p>
    <p style="color:#6b7280;font-size:13px">This link expires in 15 minutes and can be used once.</p>
    ${footer}
  </div>`;

  return sendResendEmail({
    to,
    subject: "STRATUM.ai — your sign-in link",
    html,
  }).then((sent) => {
    if (sent.ok && sent.via === "resend_testing_owner") {
      return { ok: false, reason: "testing_domain_blocked" };
    }
    return sent;
  });
}

/**
 * Issue a magic login email for an existing account. Does not reveal whether the email exists.
 * @returns {Promise<{ ok: boolean, reason?: string, sent?: boolean }>}
 */
export async function issueMagicLinkForEmail(rawEmail) {
  const email = String(rawEmail ?? "").trim().toLowerCase();
  if (!email) return { ok: false, reason: "bad_input" };
  if (!isOutboundMailConfigured()) return { ok: false, reason: "no_mail" };

  const user = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Always look successful to the client (anti-enumeration).
  if (!user) return { ok: true, sent: false };

  const loginToken = await createOneTimeLoginToken(email, "magic-login");
  if (!loginToken) return { ok: false, reason: "token_failed" };

  const sent = await sendMagicLinkEmail({
    to: user.email,
    name: user.name,
    loginToken,
  });
  if (!sent.ok) return { ok: false, reason: sent.reason || "send_failed" };
  return { ok: true, sent: true };
}

export async function issueVerificationEmailForUser(user) {
  if (!user?.email || user.emailVerified) {
    return { ok: false, reason: "not_needed" };
  }

  const rawToken = await createEmailVerificationToken(user.email);
  if (!rawToken) return { ok: false, reason: "token_failed" };

  return sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
  });
}
