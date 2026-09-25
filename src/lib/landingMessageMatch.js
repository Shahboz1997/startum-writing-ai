/**
 * Google Ads message match: map Final URL params → H1 / CTA copy.
 * Use `?intent=task1|task2|evaluate` or keyword hints in utm_term / utm_campaign.
 */

export const LANDING_INTENT_IDS = ['task1', 'task2', 'evaluate', 'default'];

const INTENTS = {
  task1: {
    id: 'task1',
    tagline: 'IELTS Writing Task 1',
    h1: 'IELTS Writing Task 1 Simulation & AI Evaluation',
    description:
      'Paste your Academic chart report or GT letter. Get an instant band estimate and see how Stratum scores Task Achievement.',
    cta: 'Check Task 1',
    editorLabel: 'Task 1 — Try it',
    placeholder: 'Paste ~50–80 words of your Task 1 response — then hit Check for a free band preview.',
    analysisMode: 'task1',
    offerLine: '1 free band preview — no email. Full error breakdown after Google sign-in.',
  },
  task2: {
    id: 'task2',
    tagline: 'IELTS Writing Task 2',
    h1: 'IELTS Writing Task 2 Essay Checker',
    description:
      'Paste your Task 2 essay. Instant AI band score with Band 9-style criteria — Task Response, Cohesion, Lexis, Grammar.',
    cta: 'Check Essay',
    editorLabel: 'Task 2 — Try it',
    placeholder: 'Paste ~50–80 words of your essay here — then hit Check for a free band preview.',
    analysisMode: 'task2',
    offerLine: '1 free band preview — no email. Full error breakdown after Google sign-in.',
  },
  evaluate: {
    id: 'evaluate',
    tagline: 'Instant band score',
    h1: 'Instant AI Evaluation for Your IELTS Writing. Get Your Band Score in 60 Seconds',
    description:
      'Hot traffic wants a score now. Paste your essay, get a preliminary band, then unlock the full examiner report in one click.',
    cta: 'Check Essay',
    editorLabel: 'Your essay — Try it',
    placeholder: 'Paste your IELTS Writing excerpt here for an instant preliminary band score.',
    analysisMode: 'task2',
    offerLine: '1 free band preview — no email. Full error breakdown after Google sign-in.',
  },
  default: {
    id: 'default',
    tagline: 'AI-Powered Writing Assessment',
    h1: 'Master IELTS with Stratum Intelligence',
    description:
      'Elevate your IELTS score with precision AI-driven evaluation for Writing Task 1 and Task 2. Get instant Band 9.0-style feedback.',
    cta: 'Check Essay',
    editorLabel: 'Task 2 — Try it',
    placeholder: 'Paste ~50–80 words of your essay here — then hit Check for a free band preview.',
    analysisMode: 'task2',
    offerLine: '1 free band preview — no email. Full error breakdown after Google sign-in.',
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
