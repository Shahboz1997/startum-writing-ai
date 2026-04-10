/**
 * Canonical IELTS Academic Writing Task 1 instruction (never replace with a model "answer").
 */
export const IELTS_TASK1_STANDARD_INSTRUCTION =
  'Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.';

/**
 * Combine optional short lead-in (chart title / what is shown) with the standard instruction.
 */
export function buildTask1QuestionPaperText(intro) {
  const t = typeof intro === 'string' ? intro.trim() : '';
  if (!t) return IELTS_TASK1_STANDARD_INSTRUCTION;
  return `${t}\n\n${IELTS_TASK1_STANDARD_INSTRUCTION}`;
}
