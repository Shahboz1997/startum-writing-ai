/**
 * Retention helpers: mark activation date + fire return_day_2 once on a later calendar day.
 */

export const ACTIVATED_AT_KEY = 'stratum_activated_at';
export const RETURN_DAY2_SENT_KEY = 'stratum_return_day2_sent';

function calendarDayUtcMs(d) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Record first authenticated / first-check moment (idempotent). */
export function markActivatedAt(isoDate = new Date().toISOString()) {
  if (typeof window === 'undefined') return;
  try {
    if (!window.localStorage.getItem(ACTIVATED_AT_KEY)) {
      window.localStorage.setItem(ACTIVATED_AT_KEY, String(isoDate));
    }
  } catch {
    /* private mode */
  }
}

/**
 * If the user returns on a later local calendar day than activation, fire once.
 * @returns {{ shouldTrack: boolean, daysSinceActivation: number }}
 */
export function getReturnDay2Payload() {
  if (typeof window === 'undefined') {
    return { shouldTrack: false, daysSinceActivation: 0 };
  }
  try {
    if (window.localStorage.getItem(RETURN_DAY2_SENT_KEY) === '1') {
      return { shouldTrack: false, daysSinceActivation: 0 };
    }
    const raw = window.localStorage.getItem(ACTIVATED_AT_KEY);
    if (!raw) return { shouldTrack: false, daysSinceActivation: 0 };
    const activated = new Date(raw);
    if (Number.isNaN(activated.getTime())) {
      return { shouldTrack: false, daysSinceActivation: 0 };
    }
    const days = Math.floor(
      (calendarDayUtcMs(new Date()) - calendarDayUtcMs(activated)) / 86_400_000
    );
    if (days < 1) return { shouldTrack: false, daysSinceActivation: days };
    return { shouldTrack: true, daysSinceActivation: days };
  } catch {
    return { shouldTrack: false, daysSinceActivation: 0 };
  }
}

export function markReturnDay2Sent() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RETURN_DAY2_SENT_KEY, '1');
  } catch {
    /* private mode */
  }
}
