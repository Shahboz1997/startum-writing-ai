export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getLemonWebhookSecret } from '@/lib/lemonsqueezy';
import { fulfillLemonOrderCredits } from '@/lib/lemonCreditFulfillment';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';

function verifyLemonSignature(rawBody, signatureHeader, secret) {
  if (!secret || !rawBody || !signatureHeader) return false;
  const digest = Buffer.from(
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
    'utf8'
  );
  const signature = Buffer.from(String(signatureHeader), 'utf8');
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

const PERMANENT_FAIL_REASONS = new Set([
  'missing_order_id',
  'unknown_pack',
  'user_not_found',
]);

/**
 * Persist failed paid orders so ops can grant credits manually.
 * ACK with 200 only after dead-letter write succeeds (avoids silent loss + infinite Lemon retries).
 */
async function recordLemonDeadLetter({ lemonOrderId, reason, detail }) {
  const orderId = String(lemonOrderId || '').trim() || `unknown-${Date.now()}`;
  await withPrismaRetry(() =>
    getPrisma().lemonWebhookDeadLetter.upsert({
      where: { lemonOrderId: orderId },
      create: {
        lemonOrderId: orderId,
        reason: String(reason || 'unknown'),
        detail: detail ?? undefined,
      },
      update: {
        reason: String(reason || 'unknown'),
        detail: detail ?? undefined,
        resolvedAt: null,
      },
    })
  );
}

/**
 * POST /api/webhooks/lemonsqueezy
 * Lemon Squeezy → verify X-Signature → order_created → grant credits.
 */
export async function POST(request) {
  const secret = getLemonWebhookSecret();
  if (!secret) {
    console.error('[lemonsqueezy webhook] LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[lemonsqueezy webhook] body read failed', err);
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 });
  }

  const signature = request.headers.get('X-Signature') || request.headers.get('x-signature') || '';

  if (!verifyLemonSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = String(payload?.meta?.event_name || '').trim();

  // Acknowledge ignored events quickly (Lemon retries non-2xx).
  if (eventName !== 'order_created') {
    return NextResponse.json({ ok: true, ignored: eventName || 'unknown' });
  }

  const attrs = payload?.data?.attributes || {};
  const status = String(attrs.status || '').toLowerCase();
  if (status && status !== 'paid') {
    return NextResponse.json({ ok: true, ignored: `order_status_${status}` });
  }

  const lemonOrderId = String(payload?.data?.id || '').trim();
  const custom = payload?.meta?.custom_data || {};
  const userId = custom.user_id || custom.userId || null;
  const packId = custom.pack_id || custom.packId || null;
  const variantId =
    attrs.first_order_item?.variant_id ??
    attrs.variant_id ??
    null;
  const userEmailHint = attrs.user_email || attrs.customer_email || null;

  try {
    const result = await fulfillLemonOrderCredits({
      lemonOrderId,
      userId,
      packId,
      variantId,
      userEmailHint,
    });

    if (!result.ok) {
      console.error('[CRITICAL][lemonsqueezy webhook] fulfill failed', {
        lemonOrderId,
        reason: result.reason,
        packId,
        variantId,
        userId,
        userEmailHint,
      });

      const permanent = PERMANENT_FAIL_REASONS.has(result.reason);
      if (permanent) {
        try {
          await recordLemonDeadLetter({
            lemonOrderId,
            reason: result.reason,
            detail: {
              packId,
              variantId,
              userId,
              userEmailHint,
              result,
            },
          });
          // ACK after durable record — Lemon will not retry; ops resolves via dead-letter table.
          return NextResponse.json(
            { ok: false, deadLetter: true, ...result },
            { status: 200 }
          );
        } catch (dlErr) {
          console.error('[CRITICAL][lemonsqueezy webhook] dead-letter persist failed', dlErr);
          // Force Lemon retry until we can record the failure.
          return NextResponse.json(
            { error: 'Could not record unfulfilled order', reason: result.reason },
            { status: 500 }
          );
        }
      }

      // Transient / unexpected — ask Lemon to retry.
      return NextResponse.json(
        { error: 'Fulfillment failed', reason: result.reason },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      duplicate: Boolean(result.duplicate),
      depositId: result.depositId,
      creditsAdded: result.creditsAdded,
      newBalance: result.newBalance,
    });
  } catch (err) {
    console.error('[lemonsqueezy webhook]', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
