/**
 * First-run activation: sample Task 2 so new users reach Analyze in one click.
 * localStorage keys survive reloads; analytics uses the same first-check flag.
 */

export const FIRST_RUN_DISMISSED_KEY = 'stratum_first_run_dismissed';
export const FIRST_CHECK_DONE_KEY = 'stratum_first_check_done';
export const STUDY_PLAN_NUDGE_SHOWN_KEY = 'stratum_study_plan_nudge_shown';

/** Classic agree/disagree prompt — short enough to scan, real enough to score. */
export const FIRST_RUN_PROMPT_T2 =
  'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?';

/**
 * ~170 words — above the 10-word analyze floor, below a full exam essay.
 * Intentionally B2-ish so the checker has something useful to flag.
 */
export const FIRST_RUN_ESSAY_T2 = `Many students today only study academic subjects and do not help their local community. I believe that unpaid community service should be a required part of high school programmes because it builds valuable skills and teaches young people to care for others.

Firstly, community service gives teenagers practical experience that classrooms cannot provide. For example, when students volunteer in a nursing home or clean a public park, they learn teamwork, responsibility, and how to communicate with different age groups. These soft skills are useful later at university and at work.

Secondly, compulsory service can reduce the gap between young people and society. If teenagers regularly help neighbours, they may develop more empathy and feel that they belong to their town. As a result, they are less likely to behave in antisocial ways and more likely to support local projects after graduation.

Of course, schools must organise this carefully so that service does not harm exam preparation. A few hours each month is enough to create a positive habit without replacing important study time.

In conclusion, making unpaid community service compulsory in high school is a good idea if the workload stays reasonable. It prepares students for adult life and strengthens the community at the same time.`;

export function hasCompletedFirstCheck() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FIRST_CHECK_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markFirstCheckDone() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(FIRST_CHECK_DONE_KEY) === '1') return false;
    window.localStorage.setItem(FIRST_CHECK_DONE_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export function hasDismissedFirstRun() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FIRST_RUN_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFirstRun() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRST_RUN_DISMISSED_KEY, '1');
  } catch {
    /* private mode */
  }
}

/** Show first-run CTA for authenticated users who never checked and did not dismiss. */
export function shouldShowFirstRunBanner({ isAuthenticated, hasLocalResult } = {}) {
  if (!isAuthenticated) return false;
  if (hasLocalResult) return false;
  if (hasCompletedFirstCheck()) return false;
  if (hasDismissedFirstRun()) return false;
  return true;
}

/** Shared funnel copy: activation before monetization. */
export const FUNNEL_OFFER_LINE_SHORT =
  'Free demo → Sign in → 3 free checks. Top up only when you need more.';

export const FUNNEL_OFFER_LINE =
  'Free demo → Sign in → 3 free checks. Practice estimate only — not an official IELTS score.';

/** True once — caller should show a soft Study plan CTA after first Analyze. */
export function shouldShowStudyPlanNudge() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STUDY_PLAN_NUDGE_SHOWN_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markStudyPlanNudgeShown() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STUDY_PLAN_NUDGE_SHOWN_KEY, '1');
  } catch {
    /* private mode */
  }
}
