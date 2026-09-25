import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import {
  AI_RATE_LIMITS,
  GUEST_CHECK_LIMIT,
  getClientIp,
  hashClientIp,
  jsonAuthRequired,
  jsonGuestQuotaExhausted,
  jsonRateLimitExceeded,
} from '@/lib/aiAccessShared';

export {
  AI_RATE_LIMITS,
  AUTH_REQUIRED_CODE,
  GUEST_CHECK_LIMIT,
  GUEST_QUOTA_EXHAUSTED_CODE,
  RATE_LIMIT_EXCEEDED_CODE,
  getClientIp,
  hashClientIp,
  isAuxiliaryOpenAiCheckRequest,
  isMainEssayAnalysisRequest,
  jsonAuthRequired,
  jsonGuestQuotaExhausted,
  jsonRateLimitExceeded,
} from '@/lib/aiAccessShared';

function rateLimitBucketKey(scope, route, windowStartMs, windowMs) {
  const windowId = Math.floor(windowStartMs / windowMs);
  return `${scope}:${route}:${windowId}`;
}

/**
 * Atomic fixed-window consume via conditional UPDATE / INSERT.
 * Avoids TOCTOU where parallel requests all pass a soft count read.
 */
async function consumeRateLimitBucket(bucketKey, { limit, windowMs }) {
  const now = new Date();
  const windowFloor = new Date(now.getTime() - windowMs);

  return withPrismaRetry(async () => {
    const prisma = getPrisma();

    // Fast path: increment if bucket exists, still in window, and under limit.
    const incremented = await prisma.$queryRaw`
      UPDATE "AiRateLimitBucket"
      SET count = count + 1
      WHERE "bucketKey" = ${bucketKey}
        AND "windowStart" >= ${windowFloor}
        AND count < ${limit}
      RETURNING count, "windowStart"
    `;

    if (Array.isArray(incremented) && incremented.length > 0) {
      return { ok: true, remaining: limit - Number(incremented[0].count) };
    }

    // Existing bucket at/over limit (same window)?
    const existing = await prisma.aiRateLimitBucket.findUnique({
      where: { bucketKey },
    });
    if (
      existing &&
      now.getTime() - existing.windowStart.getTime() < windowMs &&
      existing.count >= limit
    ) {
      const retryAfterMs = Math.max(
        1,
        windowMs - (now.getTime() - existing.windowStart.getTime())
      );
      return { ok: false, retryAfterMs };
    }

    // Missing or expired window → reset to 1 (upsert).
    await prisma.aiRateLimitBucket.upsert({
      where: { bucketKey },
      create: { bucketKey, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1 };
  });
}

async function enforceRateLimit(scope, route) {
  const cfg = AI_RATE_LIMITS[route];
  if (!cfg) return { ok: true };

  const nowMs = Date.now();
  const bucketKey = rateLimitBucketKey(scope, route, nowMs, cfg.windowMs);
  const result = await consumeRateLimitBucket(bucketKey, cfg);
  if (!result.ok) {
    return { ok: false, response: jsonRateLimitExceeded(result.retryAfterMs) };
  }
  return { ok: true };
}

/**
 * Task/topic/image helpers on POST /api/check.
 * Authenticated: user + IP rate limits.
 * Guest: IP rate limits only (no sign-in required).
 */
export async function resolveAuxiliaryAiAccess(request, session, route) {
  const ipHash = await hashClientIp(getClientIp(request));

  if (session?.user?.id) {
    return requireAuthenticatedAiAccess(request, session, route);
  }

  const guestBurst = await enforceRateLimit(`guest-ip:${ipHash}`, 'checkGuestIp');
  if (!guestBurst.ok) return guestBurst;

  const ipRl = await enforceRateLimit(`ip:${ipHash}`, route);
  if (!ipRl.ok) return ipRl;

  return { ok: true, userId: null, ipHash, isGuest: true };
}

export async function requireAuthenticatedAiAccess(request, session, route) {
  if (!session?.user?.id) {
    return {
      ok: false,
      response: jsonAuthRequired('Sign in to use AI features.'),
    };
  }

  const ipHash = await hashClientIp(getClientIp(request));
  const userScope = `user:${session.user.id}`;

  const userRl = await enforceRateLimit(userScope, route);
  if (!userRl.ok) return userRl;

  const ipRl = await enforceRateLimit(`ip:${ipHash}`, route);
  if (!ipRl.ok) return ipRl;

  return { ok: true, userId: session.user.id };
}

/**
 * Atomically consume one guest preview slot before OpenAI.
 * Returns { ok: false } when the IP already used its free check.
 */
export async function tryConsumeGuestCheckQuota(ipHash) {
  if (!ipHash) return { ok: false };
  return withPrismaRetry(async () => {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw`
      INSERT INTO "GuestCheckQuota" ("ipHash", count, "createdAt", "updatedAt")
      VALUES (${ipHash}, 1, NOW(), NOW())
      ON CONFLICT ("ipHash") DO UPDATE
      SET count = "GuestCheckQuota".count + 1,
          "updatedAt" = NOW()
      WHERE "GuestCheckQuota".count < ${GUEST_CHECK_LIMIT}
      RETURNING count
    `;
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false };
    }
    return { ok: true, count: Number(rows[0].count) };
  });
}

/** Refund guest quota when preview OpenAI fails after consume. */
export async function refundGuestCheckQuota(ipHash) {
  if (!ipHash) return;
  await withPrismaRetry(() =>
    getPrisma().$executeRaw`
      UPDATE "GuestCheckQuota"
      SET count = GREATEST(0, count - 1), "updatedAt" = NOW()
      WHERE "ipHash" = ${ipHash}
    `
  );
}

/** @deprecated Prefer tryConsumeGuestCheckQuota before OpenAI. Kept for callers that already reserved. */
export async function consumeGuestCheckQuota(ipHash) {
  if (!ipHash) return;
  await withPrismaRetry(() =>
    getPrisma().guestCheckQuota.upsert({
      where: { ipHash },
      create: { ipHash, count: 1 },
      update: { count: { increment: 1 } },
    })
  );
}

/**
 * Main essay analysis on POST /api/check.
 * Signed-in: credits path. Guest: 1 band-preview per IP (no rewrite / no persist).
 * Guest quota is consumed later in the route (before OpenAI) via tryConsumeGuestCheckQuota.
 */
export async function resolveMainCheckAccess(request, session) {
  const ip = getClientIp(request);
  const ipHash = await hashClientIp(ip);
  const userId = session?.user?.id || null;

  if (userId) {
    const authAccess = await requireAuthenticatedAiAccess(request, session, 'check');
    if (!authAccess.ok) return authAccess;
    return { ok: true, userId, ipHash, isGuest: false };
  }

  const guestBurst = await enforceRateLimit(`guest-ip:${ipHash}`, 'checkGuestIp');
  if (!guestBurst.ok) return guestBurst;

  const ipRl = await enforceRateLimit(`ip:${ipHash}`, 'check');
  if (!ipRl.ok) return ipRl;

  return { ok: true, userId: null, ipHash, isGuest: true };
}
