/** Strip full examiner payload to a signup-gated preview for guests. */

export const GUEST_PREVIEW_MAX_WORDS = 120;
export const GUEST_PREVIEW_MIN_WORDS = 10;

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * @param {Record<string, unknown>} result
 */
export function toGuestCheckPreview(result) {
  const criteriaIn = result?.criteria && typeof result.criteria === 'object' ? result.criteria : {};
  const criteria = {};
  for (const [key, val] of Object.entries(criteriaIn)) {
    const score = val && typeof val === 'object' ? val.score : null;
    const comment =
      val && typeof val === 'object' && typeof val.comment === 'string'
        ? val.comment.slice(0, 140)
        : '';
    criteria[key] = { score: score ?? null, comment };
  }

  const errors = Array.isArray(result?.errors) ? result.errors : [];
  const topIssues = errors.slice(0, 3).map((e) => ({
    type: String(e?.type || e?.category || 'issue'),
    message: String(e?.message || e?.explanation || e?.original || '').slice(0, 140),
  }));

  return {
    preview: true,
    upgradeRequired: true,
    overall_band: result?.overall_band ?? null,
    word_count: result?.word_count ?? null,
    criteria,
    improvement_strategy: String(result?.improvement_strategy || '').slice(0, 280),
    topIssues,
    savedId: null,
  };
}
