/**
 * Minimal product funnel events for GA4 (gtag) + Vercel Analytics pageviews.
 *
 * Event plan (wire as surfaces ship):
 * - demo_start     — guest taps Check free / starts hero preview
 * - demo_complete  — guest preview band returned successfully
 * - signup         — account created (also fires Ads registration conversion)
 * - checkout_click — user starts Lemon Squeezy credit checkout
 * - telegram_click — bot or channel CTA clicked (params: target=bot|channel, placement)
 * - guide_download — free PDF lead magnet downloaded (params: guide_slug)
 *
 * Prefer these names in Ads/GA custom conversions. Do not invent offline KPIs here.
 */

import { trackGoogleAdsRegistrationConversion } from '@/lib/googleAdsConversions';

function gtag(...args) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag(...args);
}

/**
 * @param {string} name
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || !name) return;
  const clean = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    clean[k] = v;
  }
  gtag('event', name, clean);
}

export function trackDemoStart({ source = 'hero', analysisMode } = {}) {
  trackEvent('demo_start', { source, analysis_mode: analysisMode });
}

export function trackDemoComplete({ source = 'hero', analysisMode, overallBand } = {}) {
  trackEvent('demo_complete', {
    source,
    analysis_mode: analysisMode,
    overall_band: overallBand != null ? String(overallBand) : undefined,
  });
}

export function trackSignup({ method = 'google' } = {}) {
  trackGoogleAdsRegistrationConversion({ method });
  trackEvent('signup', { method: String(method || 'google') });
}

export function trackCheckoutClick({ packId, source = 'pricing' } = {}) {
  trackEvent('checkout_click', { pack_id: packId, source });
}

export function trackTelegramClick({ target = 'bot', placement = 'landing' } = {}) {
  trackEvent('telegram_click', { target, placement });
}

export function trackGuideDownload({ guideSlug } = {}) {
  trackEvent('guide_download', { guide_slug: guideSlug });
}
