export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { isAdminEmail } from '@/lib/admin';

/**
 * GET /api/user/admin-status
 * Safe for any signed-in user (not under /api/admin proxy gate).
 * Returns { admin, authenticated } — never leaks the allowlist.
 */
export async function GET() {
  const session = await safeAuth();
  const email = session?.user?.email;
  return NextResponse.json({
    authenticated: Boolean(session?.user?.id),
    admin: Boolean(email && isAdminEmail(email)),
  });
}
