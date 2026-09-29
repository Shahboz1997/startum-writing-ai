/**
 * Google Ads message match: map Final URL params → H1 / CTA copy.
 * Use `?intent=task1|task2|evaluate` or keyword hints in utm_term / utm_campaign.
 */

export const LANDING_INTENT_IDS = ['task1', 'task2', 'evaluate', 'default'];

const INTENTS = {
  task1: {
    id: 'task1',
    tagline: 'IELTS Writing Task 1',
    h1: 'Catches Task 1 data errors — examiner-style score in ~30 seconds',
    description:
      'Paste your Academic chart report or GT letter. Spot misread trends and logic gaps, then unlock the full Task Achievement breakdown after sign-in.',
    cta: 'Check Task 1',
    editorLabel: 'Task 1 — Try it',
    placeholder: 'Paste ~50–80 words of your Task 1 response — then hit Check for a free band preview.',
    analysisMode: 'task1',
    offerLine: 'Free demo → Sign in → 3 free checks. Practice estimate only — not an official IELTS score.',
  },
  task2: {
    id: 'task2',
    tagline: 'IELTS Writing Task 2',
    h1: 'IELTS Writing Task 2 AI checker — 4 criteria in ~30 seconds',
    description:
      'Paste your Task 2 essay for a free practice band. Sign in for Task Response, Cohesion, Lexis, Grammar, fixes, and a model rewrite.',
    cta: 'Check Essay',
    editorLabel: 'Task 2 — Try it',
    placeholder: 'Paste ~50–80 words of your essay here — then hit Check for a free band preview.',
    analysisMode: 'task2',
    offerLine: 'Free demo → Sign in → 3 free checks. Practice estimate only — not an official IELTS score.',
  },
  evaluate: {
    id: 'evaluate',
    tagline: 'Instant practice band',
    h1: 'Get your IELTS Writing practice band in ~30 seconds',
    description:
      'Paste your essay, get a preliminary practice band, then unlock the full examiner-style report in one click. Not an official IELTS score.',
    cta: 'Check Essay',
    editorLabel: 'Your essay — Try it',
    placeholder: 'Paste your IELTS Writing excerpt here for an instant preliminary band score.',
    analysisMode: 'task2',
    offerLine: 'Free demo → Sign in → 3 free checks. Practice estimate only — not an official IELTS score.',
  },
  default: {
    id: 'default',
    tagline: 'IELTS Writing Task 1 & Task 2',
    h1: 'Catches Task 1 data errors and scores Task 1 & Task 2 like an examiner — in ~30 seconds.',
    description:
      'Paste a short excerpt for a free practice band. Sign in for the full 4-criteria report, data/logic flags, lexical upgrade, and model rewrite.',
    cta: 'Check Essay',
    editorLabel: 'Task 2 — Try it',
    placeholder: 'Paste ~50–80 words of your essay here — then hit Check for a free band preview.',
    analysisMode: 'task2',
    offerLine: 'Free demo → Sign in → 3 free checks. Practice estimate only — not an official IELTS score.',
  },
};

/** @param {string} raw */
function normalizeIntentKey(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  if (!s) return null;
  if (s === 't1' || s === 'task-1' || s === 'writing-task-1') return 'task1';
  if (s === 't2' || s === 'task-2' || s === 'writing-task-2' || s === 'essay') return 'task2';
  if (
    s === 'evaluate' ||
    s === 'evaluation' ||
    s === 'band-score' ||
    s === 'score' ||
    s === 'check-essay' ||
    s === 'essay-check'
  ) {
    return 'evaluate';
  }
  if (LANDING_INTENT_IDS.includes(s)) return s;
  return null;
}

/** Infer intent from free-text keyword (utm_term / campaign). */
function inferIntentFromKeyword(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return null;
  if (/task\s*1|academic\s*chart|gt\s*letter|letter\s*writing|график|письмо/.test(t)) return 'task1';
  if (/оценить|оценк|band\s*score|essay\s*check|check\s*essay|evaluat|score\s*my/.test(t)) {
    return 'evaluate';
  }
  if (/task\s*2|essay|эссе|writing\s*task\s*2/.test(t)) return 'task2';
  return null;
}

/**
 * @param {URLSearchParams | Record<string, string | string[] | undefined> | null | undefined} params
 */
export function resolveLandingIntent(params) {
  const get = (key) => {
    if (!params) return '';
    if (typeof params.get === 'function') return params.get(key) || '';
    const v = params[key];
    return Array.isArray(v) ? v[0] || '' : v || '';
  };

  const fromIntent =
    normalizeIntentKey(get('intent')) ||
    normalizeIntentKey(get('h')) ||
    normalizeIntentKey(get('lp'));
  if (fromIntent && INTENTS[fromIntent]) return INTENTS[fromIntent];

  const fromKeyword =
    inferIntentFromKeyword(get('utm_term')) ||
    inferIntentFromKeyword(get('utm_campaign')) ||
    inferIntentFromKeyword(get('keyword'));
  if (fromKeyword && INTENTS[fromKeyword]) return INTENTS[fromKeyword];

  return INTENTS.default;
}

export function getLandingIntentById(id) {
  return INTENTS[normalizeIntentKey(id) || 'default'] || INTENTS.default;
}
