import { SUPPORT_MAILTO } from '@/lib/support';

/**
 * Credit packs sold via Lemon Squeezy.
 * Set LEMON_SQUEEZY_VARIANT_* in .env to the Lemon variant IDs for each pack.
 */
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    priceUsd: 9.99,
    blurb: 'Try a few full Task 1 & Task 2 checks',
    popular: false,
    savePercent: 0,
    badge: null,
    lemonVariantEnv: 'LEMON_SQUEEZY_VARIANT_STARTER',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    credits: 20,
    priceUsd: 14.99,
    blurb: 'Exam-month plan — about one check every other day',
    popular: true,
    /** vs Starter per-credit price */
    savePercent: 25,
    badge: 'Popular · Save 25%',
    lemonVariantEnv: 'LEMON_SQUEEZY_VARIANT_MONTHLY',
  },
  {
    id: 'intensive',
    name: 'Intensive',
    credits: 40,
    priceUsd: 24.99,
    blurb: 'Best value for Task 1 + Task 2 drills',
    popular: false,
    savePercent: 38,
    badge: 'Best Value · Save 38%',
    lemonVariantEnv: 'LEMON_SQUEEZY_VARIANT_INTENSIVE',
  },
];

/** Lemon Squeezy variant id for a pack (server-side; empty until env is set). */
export function getLemonVariantIdForPack(pack) {
  const envKey = pack?.lemonVariantEnv;
  if (!envKey) return '';
  return String(process.env[envKey] || '').trim();
}

export function getCreditPackByVariantId(variantId) {
  const id = String(variantId ?? '').trim();
  if (!id) return null;
  return (
    CREDIT_PACKS.find((p) => getLemonVariantIdForPack(p) === id) || null
  );
}

/** Display-only regions for pack prices (settlement stays USD). */
export const DISPLAY_CURRENCIES = [
  { id: 'RUB', label: '₽ RU', symbol: '₽', rateFromUsd: 90 },
  { id: 'USD', label: '$ EN', symbol: '$', rateFromUsd: 1 },
  { id: 'UZS', label: "so'm UZ", symbol: "so'm", rateFromUsd: 12700 },
  { id: 'TJS', label: 'с. TG', symbol: 'с.', rateFromUsd: 10.8 },
];

export function getDisplayCurrency(id = 'USD') {
  return DISPLAY_CURRENCIES.find((c) => c.id === id) || DISPLAY_CURRENCIES[1];
}

export function formatPackPrice(priceUsd, currencyId = 'USD') {
  const currency = getDisplayCurrency(currencyId);
  const amount = Number(priceUsd) * currency.rateFromUsd;
  if (currency.id === 'USD') return `$${amount.toFixed(2)}`;
  if (currency.id === 'RUB') return `₽${Math.round(amount).toLocaleString('ru-RU')}`;
  if (currency.id === 'UZS') return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
  if (currency.id === 'TJS') return `${amount.toFixed(2)} с.`;
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export function formatPerCreditPrice(pack, currencyId = 'USD') {
  const credits = Math.max(1, Number(pack?.credits) || 1);
  const per = Number(pack?.priceUsd || 0) / credits;
  return `≈ ${formatPackPrice(per, currencyId)} per essay check`;
}

/** Badge text for pack value (Popular / Best Value + save %). */
export function getPackValueBadge(pack) {
  if (!pack) return null;
  if (typeof pack.badge === 'string' && pack.badge.trim()) return pack.badge.trim();
  if (pack.popular && Number(pack.savePercent) > 0) {
    return `Popular · Save ${Math.round(pack.savePercent)}%`;
  }
  if (Number(pack.savePercent) > 0) {
    return `Best Value · Save ${Math.round(pack.savePercent)}%`;
  }
  return null;
}

export function getCreditPackById(packId) {
  if (typeof packId !== 'string' || !packId.trim()) return null;
  return CREDIT_PACKS.find((p) => p.id === packId.trim()) || null;
}

/** Prefill mail for support (fallback if claim flow unavailable). */
export function buildCreditPackMailto(pack, accountEmail = '') {
  const subject = `[STRATUM.ai] Credit pack: ${pack.name} (${pack.credits} credits)`;
  const body = [
    `Hi STRATUM support,`,
    ``,
    `I want to purchase the ${pack.name} pack.`,
    ``,
    `Package: ${pack.name}`,
    `Credits: ${pack.credits}`,
    `Price: ${formatPackPrice(pack.priceUsd)}`,
    `Account email: ${accountEmail || '(your login email)'}`,
    ``,
    `I will pay by Visa / card transfer, then use “I paid” in the app (or reply here).`,
    `Please top up my credits after you confirm the transfer.`,
    ``,
    `Thanks!`,
  ].join('\n');

  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body.slice(0, 6000));
  return `${SUPPORT_MAILTO}?${params.toString()}`;
}

export const CREDITS_TOP_UP_NOTICE =
  'Instant automated delivery. Pay securely with Visa, MasterCard or Apple Pay.';

export const CREDITS_TOP_UP_FOOTER =
  'After payment you return here — credits appear in your account within a few seconds.';

/** @deprecated Manual transfer path; Lemon Squeezy is the primary checkout. */
export const CREDITS_INVOICE_HINT =
  'Transfer the exact amount using the details below. Include your STRATUM.ai email in the payment comment.';
