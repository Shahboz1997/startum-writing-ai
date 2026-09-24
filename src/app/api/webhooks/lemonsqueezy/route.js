export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getLemonWebhookSecret } from '@/lib/lemonsqueezy';
import { fulfillLemonOrderCredits } from '@/lib/lemonCreditFulfillment';

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

  const rawBody = await request.text();
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
      console.error('[lemonsqueezy webhook] fulfill failed', result);
      // 200 so Lemon does not infinite-retry on unknown pack / user while we investigate.
      return NextResponse.json({ ok: false, ...result }, { status: 200 });
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
      { error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
