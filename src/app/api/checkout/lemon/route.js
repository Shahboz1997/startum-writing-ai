export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { safeAuth } from '@/lib/safeAuth';
import { getPrisma } from '@/lib/prisma';
import {
  ensureLemonSqueezyConfigured,
  getLemonStoreId,
  isLemonSqueezyConfigured,
} from '@/lib/lemonsqueezy';
import {
  getCreditPackById,
  getLemonVariantIdForPack,
} from '@/lib/creditPacks';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';

/**
 * POST /api/checkout/lemon
 * Body: { packId: 'starter' | 'monthly' | 'intensive' }
 * Returns: { checkoutUrl }
 */
export async function POST(request) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isLemonSqueezyConfigured()) {
    return NextResponse.json(
      {
        error:
          'Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY and LEMON_SQUEEZY_STORE_ID.',
        code: 'LEMON_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const packId = typeof body?.packId === 'string' ? body.packId.trim() : '';
  const pack = getCreditPackById(packId);
  if (!pack) {
    return NextResponse.json({ error: 'Unknown credit pack' }, { status: 400 });
  }

  const variantId = getLemonVariantIdForPack(pack);
  if (!variantId) {
    return NextResponse.json(
      {
        error: `Missing Lemon variant id for pack "${pack.id}". Set ${pack.lemonVariantEnv} in env.`,
        code: 'LEMON_VARIANT_MISSING',
      },
      { status: 503 }
    );
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    ensureLemonSqueezyConfigured();
    const storeId = getLemonStoreId();
    const origin = getMetadataBaseUrl().replace(/\/+$/, '');
    const redirectUrl = `${origin}/?app=1&credits=success`;

    const { data, error, statusCode } = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user.email,
        name: user.name || undefined,
        custom: {
          user_id: user.id,
          pack_id: pack.id,
        },
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
      },
      productOptions: {
        name: `STRATUM.ai — ${pack.credits} credits`,
        description: `${pack.name}: ${pack.credits} essay analysis credits.`,
        redirectUrl,
        receiptButtonText: 'Back to STRATUM',
        receiptLinkUrl: redirectUrl,
        enabledVariants: [Number(variantId) || variantId],
      },
    });

    if (error || !data?.data?.attributes?.url) {
      console.error('[/api/checkout/lemon]', statusCode, error);
      return NextResponse.json(
        {
          error: error?.message || 'Could not create Lemon Squeezy checkout',
          code: 'LEMON_CHECKOUT_FAILED',
        },
        { status: statusCode && statusCode >= 400 ? statusCode : 502 }
      );
    }

    return NextResponse.json({
      checkoutUrl: data.data.attributes.url,
      packId: pack.id,
      credits: pack.credits,
    });
  } catch (err) {
    console.error('[/api/checkout/lemon]', err);
    return NextResponse.json(
      { error: err?.message || 'Checkout failed', code: 'LEMON_CHECKOUT_ERROR' },
      { status: 500 }
    );
  }
}
