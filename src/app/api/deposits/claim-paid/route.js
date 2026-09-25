export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import {
  DEPOSIT_CLAIM_COOLDOWN_MS,
  DEPOSIT_STATUSES,
  getCreditPackById,
  sanitizeDepositNote,
} from '@/lib/deposits';
import { sendDepositPaidAdminEmail, isDepositMailConfigured } from '@/lib/resendMail';

/**
 * User clicked “I paid” after transferring to the published Visa / card.
 * Creates DepositRequest + emails admins via Resend.
 *
 * Body: { packId: string, note?: string, currency?: string }
 */
export async function POST(request) {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const pack = getCreditPackById(body?.packId);
    if (!pack) {
      return NextResponse.json({ error: 'Unknown pack' }, { status: 400 });
    }

    const currency =
      typeof body?.currency === 'string' && body.currency.trim()
        ? body.currency.trim().slice(0, 8).toUpperCase()
        : 'USD';
    const note = sanitizeDepositNote(body?.note);

    const prisma = getPrisma();
    const user = await withPrismaRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true },
      })
    );

    if (!user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recent = await withPrismaRetry(() =>
      prisma.depositRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, status: true },
      })
    );

    if (recent?.createdAt) {
      const elapsed = Date.now() - recent.createdAt.getTime();
      if (elapsed < DEPOSIT_CLAIM_COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((DEPOSIT_CLAIM_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: 'Please wait before submitting another payment claim.',
            code: 'DEPOSIT_COOLDOWN',
            retryAfterSec,
          },
          { status: 429 }
        );
      }
    }

    const deposit = await withPrismaRetry(() =>
      prisma.depositRequest.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          packId: pack.id,
          packName: pack.name,
          credits: pack.credits,
          amountUsd: pack.priceUsd,
          currency,
          status: DEPOSIT_STATUSES.PAID_CLAIMED,
          note,
        },
      })
    );

    let notify = { ok: false, reason: 'skipped' };
    if (isDepositMailConfigured()) {
      notify = await sendDepositPaidAdminEmail(deposit);
      if (notify.ok) {
        await withPrismaRetry(() =>
          prisma.depositRequest.update({
            where: { id: deposit.id },
            data: { notifySentAt: new Date() },
          })
        );
      } else {
        console.error(
          '[deposits/claim-paid] admin email failed after deposit save',
          deposit.id,
          notify.reason
        );
      }
    } else {
      notify = { ok: false, reason: 'no_mail' };
      console.warn(
        '[deposits/claim-paid] RESEND_API_KEY and EMAIL_USER/EMAIL_PASS missing; deposit saved but admin email skipped',
        deposit.id
      );
    }

    return NextResponse.json({
      ok: true,
      deposit: {
        id: deposit.id,
        packId: deposit.packId,
        packName: deposit.packName,
        credits: deposit.credits,
        amountUsd: deposit.amountUsd,
        currency: deposit.currency,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      notify: {
        ok: Boolean(notify.ok),
        reason: notify.ok ? undefined : notify.reason,
      },
    });
  } catch (err) {
    console.error('[deposits/claim-paid]', err);
    return NextResponse.json({ error: 'Could not submit payment claim' }, { status: 500 });
  }
}
