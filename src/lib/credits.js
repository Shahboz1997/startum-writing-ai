/** Starting balance for new signups (keep in sync with Prisma User.credits @default). */
export const CREDITS_DEFAULT_NEW_USER = 1;

/** Returned in JSON when /api/check refuses analysis (client may read `code`). */
export const CREDITS_EXHAUSTED_CODE = 'CREDITS_EXHAUSTED';

/** Upper bound for stored essay-check credits (normal use + admin). */
export const CREDITS_MAX = 5;

/** Lower bound when clamping any persisted value (e.g. after decrement). */
export const CREDITS_MIN_GENERAL = 0;

/** Lower bound when an admin manually sets credits (no “0 checks left” via admin UI). */
export const CREDITS_MIN_ADMIN_MANUAL = 1;

export function clampCreditsGeneral(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return CREDITS_MIN_GENERAL;
  return Math.min(CREDITS_MAX, Math.max(CREDITS_MIN_GENERAL, x));
}

/** For POST /api/admin/credits — forced range 1..5. */
export function clampCreditsAdminManual(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return CREDITS_MIN_ADMIN_MANUAL;
  return Math.min(CREDITS_MAX, Math.max(CREDITS_MIN_ADMIN_MANUAL, x));
}
