import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { clampCreditsAdminManual, normalizeCreditsBalance } from '@/lib/credits';
import { getCreditPackById, getCreditPackByVariantId } from '@/lib/creditPacks';
import { DEPOSIT_STATUSES } from '@/lib/deposits';
import { sendDepositCreditedUserEmail } from '@/lib/resendMail';

/**
 * Idempotent credit grant after Lemon Squeezy `order_created` (paid).
 * Uses DepositRequest.lemonOrderId as the unique payment key.
 */
export async function fulfillLemonOrderCredits({
  lemonOrderId,
  userId,
  packId,
  variantId,
  userEmailHint,
}) {
  const orderId = String(lemonOrderId || '').trim();
  if (!orderId) {
    return { ok: false, reason: 'missing_order_id' };
  }

  const prisma = getPrisma();

  const existing = await prisma.depositRequest.findUnique({
    where: { lemonOrderId: orderId },
    select: { id: true, status: true, userId: true, credits: true },
  });
  if (existing?.status === DEPOSIT_STATUSES.CREDITED) {
    return { ok: true, duplicate: true, depositId: existing.id };
  }

  let pack =
    (packId && getCreditPackById(packId)) ||
    (variantId != null && getCreditPackByVariantId(variantId)) ||
    null;

  if (!pack) {
    return { ok: false, reason: 'unknown_pack', packId, variantId };
  }

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, email: true, name: true, credits: true },
    });
  }
  if (!user && userEmailHint) {
    user = await prisma.user.findUnique({
      where: { email: String(userEmailHint).trim().toLowerCase() },
      select: { id: true, email: true, name: true, credits: true },
    });
  }
  if (!user) {
    return { ok: false, reason: 'user_not_found', userId, userEmailHint };
  }

  const current = normalizeCreditsBalance(user.credits);
  const nextCredits = clampCreditsAdminManual(current + pack.credits);

  const result = await prisma.$transaction(async (tx) => {
    const again = await tx.depositRequest.findUnique({
      where: { lemonOrderId: orderId },
      select: { id: true, status: true },
    });
    if (again?.status === DEPOSIT_STATUSES.CREDITED) {
      return { duplicate: true, depositId: again.id, user, nextCredits: null };
    }

    let deposit;
    if (again) {
      deposit = await tx.depositRequest.update({
        where: { id: again.id },
        data: {
          status: DEPOSIT_STATUSES.CREDITED,
          creditedAt: new Date(),
          adminNote: `Lemon Squeezy order ${orderId}`,
          packId: pack.id,
          packName: pack.name,
          credits: pack.credits,
          amountUsd: pack.priceUsd,
        },
      });
    } else {
      deposit = await tx.depositRequest.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          packId: pack.id,
          packName: pack.name,
          credits: pack.credits,
          amountUsd: pack.priceUsd,
          currency: 'USD',
          status: DEPOSIT_STATUSES.CREDITED,
          lemonOrderId: orderId,
          adminNote: `Lemon Squeezy order ${orderId}`,
          creditedAt: new Date(),
        },
      });
    }

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { credits: nextCredits },
      select: { id: true, email: true, name: true, credits: true },
    });

    return { duplicate: false, deposit, user: updatedUser, nextCredits };
  });

  if (!result.duplicate && result.user) {
    void sendDepositCreditedUserEmail({
      to: result.user.email,
      name: result.user.name,
      packName: pack.name,
      credits: pack.credits,
      newBalance: result.user.credits,
    });
  }

  return {
    ok: true,
    duplicate: Boolean(result.duplicate),
    depositId: result.deposit?.id || result.depositId,
    creditsAdded: pack.credits,
    newBalance: result.user?.credits ?? null,
  };
}
