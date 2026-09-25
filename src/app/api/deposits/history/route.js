export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';

/**
 * Current user's top-up / deposit claim history.
 */
export async function GET() {
  try {
    const session = await safeAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    const deposits = await withPrismaRetry(() =>
      prisma.depositRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          packId: true,
          packName: true,
          credits: true,
          amountUsd: true,
          currency: true,
          status: true,
          createdAt: true,
          creditedAt: true,
        },
      })
    );

    return NextResponse.json({
      deposits: deposits.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        creditedAt: d.creditedAt ? d.creditedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    console.error('[deposits/history]', err);
    return NextResponse.json({ error: 'Could not load deposit history' }, { status: 500 });
  }
}
