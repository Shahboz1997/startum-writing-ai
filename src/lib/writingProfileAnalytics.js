/**
 * Aggregates IELTS writing checks for study-plan / weak-area analytics.
 * Uses stored `feedback` JSON (criteria + errors) — same shape as check API.
 */

function normalizeExaminerErrorType(t) {
  const s = String(t || '')
    .toLowerCase()
    .trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (s === 'grammar' || s === 'logic' || s === 'lexical') return s;
  return 'grammar';
}

function collectErrorsFromFeedback(fb) {
  const byKey = new Map();
  const push = (row) => {
    const original = String(row?.original ?? row?.phrase ?? row?.text ?? '').trim();
    if (!original) return;
    const key = original.toLowerCase();
    if (byKey.has(key)) return;
    byKey.set(key, { type: normalizeExaminerErrorType(row?.type ?? row?.category) });
  };
  (Array.isArray(fb.errors) ? fb.errors : []).forEach(push);
  (Array.isArray(fb.logical_errors) ? fb.logical_errors : []).forEach((e) =>
    push({ phrase: e?.phrase, text: e?.text, type: 'logic' })
  );
  (Array.isArray(fb.corrections) ? fb.corrections : []).forEach(push);
  (Array.isArray(fb.highlights) ? fb.highlights : []).forEach((h) =>
    push({ text: h?.text, type: h?.type })
  );
  return Array.from(byKey.values());
}

const CRITERIA_DEF = [
  { key: 'ta', field: (isT1) => (isT1 ? 'Task_Achievement' : 'Task_Response'), labelEn: 'Task response / achievement', labelRu: 'Выполнение задания' },
  { key: 'cc', field: () => 'Coherence_and_Cohesion', labelEn: 'Coherence & cohesion', labelRu: 'Связность и связность' },
  { key: 'lr', field: () => 'Lexical_Resource', labelEn: 'Lexical resource', labelRu: 'Лексика' },
  { key: 'gra', field: () => 'Grammatical_Range_and_Accuracy', labelEn: 'Grammar', labelRu: 'Грамматика' },
];

/** Curated free resources — extend as needed */
export const RESOURCE_HINTS = {
  ta: [
    { title: 'IELTS Writing task achievement', titleRu: 'IELTS: выполнение задания', url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/writing' },
    { title: 'Planning your essay', titleRu: 'План эссе', url: 'https://learnenglish.britishcouncil.org/skills/writing' },
  ],
  cc: [
    { title: 'Cohesion and linking words', titleRu: 'Связность и связующие слова', url: 'https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/linking-words-and-phrases' },
  ],
  lr: [
    { title: 'Vocabulary for IELTS', titleRu: 'Лексика для IELTS', url: 'https://learnenglish.britishcouncil.org/vocabulary' },
  ],
  gra: [
    { title: 'English grammar reference', titleRu: 'Справочник по грамматике', url: 'https://learnenglish.britishcouncil.org/grammar' },
  ],
  grammar: [{ title: 'Grammar practice', titleRu: 'Практика грамматики', url: 'https://learnenglish.britishcouncil.org/grammar' }],
  logic: [{ title: 'Critical reading & argument', titleRu: 'Аргументация', url: 'https://learnenglish.britishcouncil.org/skills/writing' }],
  lexical: [{ title: 'Vocabulary topics', titleRu: 'Лексические темы', url: 'https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary' }],
};

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function buildPlanCopy(weakKeys, locale) {
  const isRu = locale === 'ru';
  const names = {
    ta: isRu ? 'выполнение задания и позицию' : 'task response',
    cc: isRu ? 'связность и структуру абзацев' : 'coherence and cohesion',
    lr: isRu ? 'лексику и точность слов' : 'lexical resource',
    gra: isRu ? 'грамматику и точность' : 'grammar and accuracy',
  };
  if (weakKeys.length === 0) {
    return isRu
      ? 'Продолжайте писать эссе — появятся средние баллы по критериям.'
      : 'Keep submitting essays to build criterion averages.';
  }
  const parts = weakKeys.map((k) => names[k]);
  if (isRu) {
    return `Сфокусируйтесь на: ${parts.join(' и ')}. Добавьте 2–3 короткие сессии в неделю по этим областям.`;
  }
  return `Prioritize: ${parts.join(' and ')}. Aim for 2–3 short weekly practice sessions on these areas.`;
}

function headlineCopy(weakKeys, locale) {
  const isRu = locale === 'ru';
  if (weakKeys.length === 0) {
    return isRu ? 'Недостаточно данных для плана' : 'Not enough data for a plan yet';
  }
  const map = {
    ta: isRu ? 'задание и аргумент' : 'task response',
    cc: isRu ? 'связность' : 'coherence',
    lr: isRu ? 'лексика' : 'vocabulary',
    gra: isRu ? 'грамматика' : 'grammar',
  };
  const bits = weakKeys.slice(0, 2).map((k) => map[k]);
  if (isRu) {
    return `Вам стоит усилить: ${bits.join(' и ')}.`;
  }
  return `You should strengthen: ${bits.join(' and ')}.`;
}

/**
 * @param {Array<{ type?: string, feedback?: string|null, score?: number|null }>} checks
 * @param {{ locale?: 'en'|'ru' }} opts
 */
export function buildWritingProfile(checks, opts = {}) {
  const locale = opts.locale === 'ru' ? 'ru' : 'en';
  const buckets = { ta: [], cc: [], lr: [], gra: [] };
  const errorTypes = { grammar: 0, logic: 0, lexical: 0 };

  for (const check of checks || []) {
    let fb = {};
    try {
      fb = typeof check.feedback === 'string' ? JSON.parse(check.feedback) : check.feedback || {};
    } catch {
      continue;
    }
    const isT1 = (check.type || 'TASK_2') === 'TASK_1';
    const c = fb.criteria || {};
    for (const def of CRITERIA_DEF) {
      const k = def.field(isT1);
      const sc = c[k]?.score;
      if (sc != null && !Number.isNaN(Number(sc))) {
        buckets[def.key].push(Number(sc));
      }
    }
    for (const e of collectErrorsFromFeedback(fb)) {
      if (errorTypes[e.type] !== undefined) errorTypes[e.type] += 1;
    }
  }

  const averages = {
    ta: avg(buckets.ta),
    cc: avg(buckets.cc),
    lr: avg(buckets.lr),
    gra: avg(buckets.gra),
  };

  const criteriaSeries = CRITERIA_DEF.map((def) => ({
    key: def.key,
    label: locale === 'ru' ? def.labelRu : def.labelEn,
    value: averages[def.key],
    n: buckets[def.key].length,
  })).filter((row) => row.value != null);

  const totalErr = errorTypes.grammar + errorTypes.logic + errorTypes.lexical;
  const errorSeries = [
    { key: 'grammar', label: locale === 'ru' ? 'Грамматика' : 'Grammar', count: errorTypes.grammar, pct: totalErr ? Math.round((errorTypes.grammar / totalErr) * 100) : 0 },
    { key: 'logic', label: locale === 'ru' ? 'Логика / задание' : 'Logic / task', count: errorTypes.logic, pct: totalErr ? Math.round((errorTypes.logic / totalErr) * 100) : 0 },
    { key: 'lexical', label: locale === 'ru' ? 'Лексика' : 'Lexical', count: errorTypes.lexical, pct: totalErr ? Math.round((errorTypes.lexical / totalErr) * 100) : 0 },
  ];

  const scored = CRITERIA_DEF.map((def) => ({
    key: def.key,
    value: averages[def.key],
  })).filter((x) => x.value != null);
  scored.sort((a, b) => a.value - b.value);
  const weakKeys = scored.slice(0, 2).map((x) => x.key);

  const headline = headlineCopy(weakKeys, locale);
  const plan = buildPlanCopy(weakKeys, locale);

  /** De-duplicate resource URLs */
  const seen = new Set();
  const recommendations = [];
  for (const k of weakKeys) {
    for (const r of RESOURCE_HINTS[k] || []) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      recommendations.push({
        criterionKey: k,
        title: locale === 'ru' ? r.titleRu : r.title,
        url: r.url,
      });
    }
  }
  const topErr = Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topErr && RESOURCE_HINTS[topErr]) {
    for (const r of RESOURCE_HINTS[topErr]) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      recommendations.push({
        criterionKey: topErr,
        title: locale === 'ru' ? r.titleRu : r.title,
        url: r.url,
      });
    }
  }

  return {
    checkCount: checks?.length ?? 0,
    criteriaWithScores: criteriaSeries.length,
    averages,
    criteriaSeries,
    errorSeries,
    totalFlaggedErrors: totalErr,
    weakCriteriaKeys: weakKeys,
    headline,
    plan,
    recommendations: recommendations.slice(0, 8),
  };
}
