/** SessionStorage bridge: landing hero paste → writing lab. */

export const LANDING_WORKSPACE_PREFILL_KEY = 'stratum_workspace_prefill';

export const LANDING_FREE_OFFER_LINE =
  'Free demo → Sign in → Buy credits. No credit card for the free checks.';

/** Under hero CTA: guest preview + account free checks. */
export const LANDING_HERO_OFFER_LINE =
  '1 free practice band now · 3 full checks after sign-in · Buy USD credits when you need more. Practice estimate only — not an official IELTS score.';

const MAX_HERO_CHARS = 4000;

/**
 * Persist a Task 2 excerpt so `/?app=1` can open with the essay already in the editor.
 * @param {string} essayText
 * @param {{ openAuth?: boolean, activeTab?: string, essayT1?: string }} [opts]
 */
export function saveLandingEssayPrefill(essayText, { openAuth = true, activeTab = 'Task 2', essayT1 } = {}) {
  if (typeof window === 'undefined') return;
  const text = String(essayText || '').trim().slice(0, MAX_HERO_CHARS);
  const payload = {
    activeTab,
    openAuth: Boolean(openAuth),
    authMessage: LANDING_FREE_OFFER_LINE,
  };
  if (text) payload.essayT2 = text;
  if (typeof essayT1 === 'string' && essayT1.trim()) {
    payload.essayT1 = essayT1.trim().slice(0, MAX_HERO_CHARS);
  }
  try {
    sessionStorage.setItem(LANDING_WORKSPACE_PREFILL_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}
