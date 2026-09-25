import { revalidateTag } from 'next/cache';
import { writingProfileTag } from '@/lib/writingProfileCache.js';

/**
 * Atomically reserve 1 credit before an expensive OpenAI run.
 * Prevents parallel checks from all passing a soft balance read and going negative.
 * @returns {{ ok: true, creditsRemaining: number } | { ok: false }}
 */
export async function reserveCheckCredit(prisma, userId) {
  const rows = await prisma.$queryRaw`
    UPDATE "User"
    SET credits = credits - 1, "updatedAt" = NOW()
    WHERE id = ${userId} AND credits >= 1
    RETURNING id, credits
  `;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false };
  }
  return { ok: true, creditsRemaining: Number(rows[0].credits) };
}

/** Refund 1 credit when analysis fails after a successful reserve. */
export async function refundCheckCredit(prisma, userId) {
  const rows = await prisma.$queryRaw`
    UPDATE "User"
    SET credits = credits + 1, "updatedAt" = NOW()
    WHERE id = ${userId}
    RETURNING id, credits
  `;
  const credits =
    Array.isArray(rows) && rows[0] != null ? Number(rows[0].credits) : null;
  return { creditsRemaining: Number.isFinite(credits) ? credits : null };
}

/**
 * Persist analysis after a successful check.
 * When `creditAlreadyReserved` is true, skip decrement (credit was taken pre-OpenAI).
 */
export async function persistCheckResult({
  prisma,
  userId,
  userText,
  promptText,
  isT1,
  result,
  creditAlreadyReserved = false,
}) {
  const typeValue = isT1 ? 'TASK_1' : 'TASK_2';
  const savedScore = Number.isFinite(Number(result?.overall_band))
    ? Number(result.overall_band)
    : null;

  const savedCheck = await prisma.check.create({
    data: {
      type: typeValue,
      content: userText,
      promptText: promptText || null,
      score: savedScore,
      feedback: result,
      userId,
    },
  });
  try {
    revalidateTag(writingProfileTag(userId));
  } catch (_) {}

  if (creditAlreadyReserved) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return {
      savedId: savedCheck.id,
      creditsRemaining: user?.credits ?? 0,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
    select: { credits: true },
  });
  return {
    savedId: savedCheck.id,
    creditsRemaining: updatedUser.credits ?? 0,
  };
}
