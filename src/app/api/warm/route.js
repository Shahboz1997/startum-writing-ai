export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

/**
 * Lightweight keep-warm endpoint for external schedulers (cron-job.org every 10 min).
 * Vercel Hobby allows only one built-in cron/day — use this URL outside Vercel to reduce cold starts.
 *
 * Optional: Authorization: Bearer <WARM_SECRET> or ?secret=
 */
export async function GET(request) {
  const expected = (process.env.WARM_SECRET || process.env.CRON_SECRET || '').trim();
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Warm endpoint requires WARM_SECRET or CRON_SECRET' },
        { status: 503 }
      );
    }
  } else {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const query = request.nextUrl.searchParams.get('secret') || '';
    if (token !== expected && query !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const t0 = Date.now();
  try {
    if ((process.env.DATABASE_URL || process.env.DIRECT_URL || '').trim()) {
      await getPrisma().$queryRaw`SELECT 1`;
    }
    return NextResponse.json({ ok: true, ms: Date.now() - t0 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, ms: Date.now() - t0, error: e?.message || 'warm failed' },
      { status: 503 }
    );
  }
}
