import { NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/authSecret';

/** One demo essay check per IP before registration (server-enforced). */
export const GUEST_CHECK_LIMIT = 1;

export const AUTH_REQUIRED_CODE = 'AUTH_REQUIRED';
export const GUEST_QUOTA_EXHAUSTED_CODE = 'GUEST_QUOTA_EXHAUSTED';
export const RATE_LIMIT_EXCEEDED_CODE = 'RATE_LIMIT_EXCEEDED';

/** Per-minute burst limits (fixed window, stored in Postgres). */
export const AI_RATE_LIMITS = {
  check: { limit: 5, windowMs: 60_000 },
  tts: { limit: 10, windowMs: 60_000 },
  checkGuestIp: { limit: 10, windowMs: 60_000 },
};

export function getAuthSecretMaterial() {
  return getAuthSecret({ required: false });
}

/** Client IP from Vercel/proxy headers. */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}

/** SHA-256 via Web Crypto (Edge + Node). */
export async function hashClientIp(ip) {
  const payload = `${getAuthSecretMaterial() || 'dev'}:ip:${String(ip || '').trim()}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function jsonAuthRequired(message) {
  return NextResponse.json(
    {
      code: AUTH_REQUIRED_CODE,
      error: message || 'Sign in to use this feature.',
    },
    { status: 401 }
  );
}

export function jsonForbidden(message) {
  return NextResponse.json(
    { error: message || 'Forbidden' },
    { status: 403 }
  );
}

export function jsonGuestQuotaExhausted() {
  return NextResponse.json(
    {
      code: GUEST_QUOTA_EXHAUSTED_CODE,
      error: `You have used your free demo check on this network. Sign in for full 4-criteria reports, rewrites, and credits.`,
      limit: GUEST_CHECK_LIMIT,
    },
    { status: 403 }
  );
}

export function jsonRateLimitExceeded(retryAfterMs) {
  const retryAfterSec = Math.ceil((retryAfterMs || 60_000) / 1000);
  return NextResponse.json(
    {
      code: RATE_LIMIT_EXCEEDED_CODE,
      error: `Too many requests. Please wait ${retryAfterSec} seconds and try again.`,
      retryAfterSec,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}

/** OpenAI helpers on /api/check (describe image, generate topic/letter). Guests: IP rate limits only. */
export function isAuxiliaryOpenAiCheckRequest(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.describeImage && body.image) return true;
  if (body.generateTask1) return true;
  if (body.generateLetterTask) return true;
  if (body.generateTopic) return true;
  return false;
}

/** Hard caps for signed-in full essay checks (cost / DoS guard). */
export const MAX_ESSAY_CHARS = 40_000;
export const MAX_ESSAY_WORDS = 1_200;

/** Main essay analysis request (signed-in users; full GPT-4o + credits). */
export function isMainEssayAnalysisRequest(body) {
  if (!body || typeof body !== 'object') return false;
  const isT1 = body.analysisMode === 'task1';
  const userText = isT1 ? body.essay1 : body.essay2;
  return typeof userText === 'string' && userText.trim().length >= 10;
}

export function getTokenUserId(token) {
  if (!token || typeof token !== 'object') return null;
  const id = token.id ?? token.sub;
  return id != null && String(id).trim() ? String(id) : null;
}

export function getTokenEmail(token) {
  if (!token || typeof token !== 'object') return '';
  return typeof token.email === 'string' ? token.email.trim() : '';
}

/** Forward verified session fields to route handlers (avoids duplicate auth() on hot paths). */
export function nextWithAuthHeaders(request, token) {
  const requestHeaders = new Headers(request.headers);
  const userId = getTokenUserId(token);
  const email = getTokenEmail(token);
  if (userId) requestHeaders.set('x-auth-user-id', userId);
  if (email) requestHeaders.set('x-auth-user-email', email);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
