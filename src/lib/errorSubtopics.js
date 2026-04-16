/**
 * Normalizes AI `subtopic` tags on writing errors + fallback heuristics for legacy reports.
 */

export const SUBTOPIC_GRAMMAR = [
  'tense_aspect',
  'articles',
  'prepositions',
  'agreement',
  'word_order',
  'punctuation',
  'spelling',
  'other_grammar',
];

export const SUBTOPIC_LEXICAL = [
  'collocation',
  'register',
  'repetition',
  'word_choice',
  'other_lexical',
];

export const SUBTOPIC_LOGIC = [
  'data_contradiction',
  'overview',
  'task_alignment',
  'other_logic',
];

const ALL = new Set([...SUBTOPIC_GRAMMAR, ...SUBTOPIC_LEXICAL, ...SUBTOPIC_LOGIC]);

function listForType(type) {
  if (type === 'grammar') return SUBTOPIC_GRAMMAR;
  if (type === 'lexical') return SUBTOPIC_LEXICAL;
  return SUBTOPIC_LOGIC;
}

/**
 * @param {string} raw
 * @param {'grammar'|'lexical'|'logic'} type
 * @param {string} [explanation]
 */
export function normalizeSubtopic(raw, type, explanation = '') {
  const allowed = listForType(type);
  let s = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  if (s && ALL.has(s)) return s;
  if (s && allowed.includes(s)) return s;
  return inferSubtopicFromExplanation(type, explanation);
}

function inferSubtopicFromExplanation(type, explanation) {
  const t = String(explanation || '').toLowerCase();
  if (type === 'grammar') {
    if (/\b(tense|aspect|present perfect|past participle|continuous|conditional)\b/.test(t)) return 'tense_aspect';
    if (/\b(article|a\/an|\bthe\b|definite|indefinite)\b/.test(t)) return 'articles';
    if (/\b(preposition|prepositional)\b/.test(t)) return 'prepositions';
    if (/\b(agreement|subject-verb|plural|singular)\b/.test(t)) return 'agreement';
    if (/\b(word order|inversion)\b/.test(t)) return 'word_order';
    if (/\b(punctuation|comma|semicolon)\b/.test(t)) return 'punctuation';
    if (/\b(spell|typo|misspell)\b/.test(t)) return 'spelling';
    return 'other_grammar';
  }
  if (type === 'lexical') {
    if (/\b(collocation|collocate)\b/.test(t)) return 'collocation';
    if (/\b(formal|informal|register|tone)\b/.test(t)) return 'register';
    if (/\b(repetit|repeat|overused)\b/.test(t)) return 'repetition';
    if (/\b(word choice|vocabulary|lexical)\b/.test(t)) return 'word_choice';
    return 'other_lexical';
  }
  if (/\b(overview|main trend|overall)\b/.test(t)) return 'overview';
  if (/\b(contradict|inconsistent|data|trend|figure)\b/.test(t)) return 'data_contradiction';
  if (/\b(prompt|task|question|off-topic)\b/.test(t)) return 'task_alignment';
  return 'other_logic';
}

const LABELS_EN = {
  tense_aspect: 'Tenses / aspect',
  articles: 'Articles',
  prepositions: 'Prepositions',
  agreement: 'Subject–verb agreement',
  word_order: 'Word order',
  punctuation: 'Punctuation',
  spelling: 'Spelling',
  other_grammar: 'Other grammar',
  collocation: 'Collocations',
  register: 'Register / tone',
  repetition: 'Repetition',
  word_choice: 'Word choice',
  other_lexical: 'Other vocabulary',
  data_contradiction: 'Data / logic consistency',
  overview: 'Overview / key features',
  task_alignment: 'Task alignment',
  other_logic: 'Other task / logic',
};

const LABELS_RU = {
  tense_aspect: 'Времена / вид',
  articles: 'Артикли',
  prepositions: 'Предлоги',
  agreement: 'Согласование',
  word_order: 'Порядок слов',
  punctuation: 'Пунктуация',
  spelling: 'Орфография',
  other_grammar: 'Прочая грамматика',
  collocation: 'Коллокации',
  register: 'Стиль / тон',
  repetition: 'Повторы',
  word_choice: 'Выбор слов',
  other_lexical: 'Прочая лексика',
  data_contradiction: 'Данные / логика',
  overview: 'Обзор / ключевые черты',
  task_alignment: 'Соответствие заданию',
  other_logic: 'Прочее (задание)',
};

export function labelSubtopic(key, locale) {
  const k = String(key || '');
  if (locale === 'ru') return LABELS_RU[k] || k;
  return LABELS_EN[k] || k;
}
