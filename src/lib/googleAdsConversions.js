/** Google Ads + GA4 conversion helpers (client-only). */

/** Registration conversion label (AW-18107551498). */
export const GOOGLE_ADS_REGISTRATION_SEND_TO =
  'AW-18107551498/JjM1CJ3TjtEcEIqerbpD';

/**
 * Purchase conversion: uses the Ads custom event `conversion_event_purchase`
 * (configured in Google Ads to listen for this event name). Prefer value + currency.
 */
export const GOOGLE_ADS_PURCHASE_EVENT = 'conversion_event_purchase';

const SIGN_UP_DEDUP_KEY = 'stratum_ads_signup_fired';
const PURCHASE_DEDUP_PREFIX = 'stratum_ads_purchase_';

function gtag(...args) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag(...args);
}

function alreadyFired(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function markFired(key) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    /* private mode */
  }
}

/** Successful account creation (email register or new OAuth user). */
export function trackGoogleAdsRegistrationConversion({ method = 'email' } = {}) {
  if (typeof window === 'undefined') return;
  if (alreadyFired(SIGN_UP_DEDUP_KEY)) return;
  markFired(SIGN_UP_DEDUP_KEY);

  gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_REGISTRATION_SEND_TO,
    value: 1.0,
    currency: 'USD',
  });
  gtag('event', 'sign_up', { method: String(method || 'email') });
}

/**
 * Successful Lemon Squeezy payment (credits topped up).
 * @param {{ value?: number, currency?: string, transactionId?: string, packId?: string }} opts
 */
export function trackGoogleAdsPurchaseConversion({
  value = 0,
  currency = 'USD',
  transactionId = '',
  packId = '',
} = {}) {
  if (typeof window === 'undefined') return;

  const dedupeKey = `${PURCHASE_DEDUP_PREFIX}${transactionId || packId || 'ok'}`;
  if (alreadyFired(dedupeKey)) return;
  markFired(dedupeKey);

  const payload = {
    value: Number(value) || 0,
    currency: String(currency || 'USD'),
    transaction_id: transactionId || undefined,
    items: packId
      ? [{ item_id: packId, item_name: `STRATUM credits (${packId})`, quantity: 1 }]
      : undefined,
  };

  gtag('event', GOOGLE_ADS_PURCHASE_EVENT, payload);
  gtag('event', 'purchase', payload);
}
