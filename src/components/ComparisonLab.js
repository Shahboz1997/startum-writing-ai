'use client';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

function normalizeErrorType(t) {
  const s = String(t || '')
    .toLowerCase()
    .trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (s === 'grammar' || s === 'logic' || s === 'lexical') return s;
  return 'grammar';
}

const ERROR_SPAN_CLASS = {
  grammar: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-b-2 border-rose-500/50',
  lexical: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-b-2 border-purple-500/50',
  logic: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-b-2 border-sky-500/50',
};

/** When the essay has no blank-line breaks, split before these discourse markers. */
const CONNECTOR_SPLIT_RE =
  /(?=\s*(?:On the one hand|On the other hand|In conclusion)\b)/gi;

const collapseInnerNewlines = (s) =>
  s
    .trim()
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 1) Split on `\n\n` into paragraphs.
 * 2) If that yields a single block (no paragraph breaks in source), split before key connectors.
 */
function splitEssayIntoParagraphs(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const hasDoubleBreak = /\n\n/.test(normalized);
  let parts = normalized.split(/\n\n/).map(collapseInnerNewlines).filter(Boolean);

  if (!hasDoubleBreak && parts.length === 1) {
    const subs = parts[0].split(CONNECTOR_SPLIT_RE).map(collapseInnerNewlines).filter(Boolean);
    if (subs.length > 1) parts = subs;
  }

  return parts.length ? parts : [collapseInnerNewlines(normalized)];
}

function stripMarkTags(text) {
  return String(text || '').replace(/<\/?mark>/gi, '');
}

function isConclusionParagraph(text) {
  return /^\s*In conclusion\b/i.test(stripMarkTags(text));
}

/** Build non-overlapping segments from one paragraph + examiner errors. */
function buildDraftErrorSegments(content, errors) {
  if (!content) return [{ kind: 'text', text: '' }];
  const items = (Array.isArray(errors) ? errors : [])
    .map((e, i) => {
      const original = (e.original ?? e.word ?? e.text ?? '').toString();
      return {
        id: e.id ?? `err-${i}`,
        original,
        originalLen: original.length,
        errorType: normalizeErrorType(e.type ?? e.category),
        explanation: (e.explanation || e.impact || '').toString(),
        suggestion: (e.suggestion || e.fixed || e.correction || '').toString(),
      };
    })
    .filter((e) => e.original.trim());

  if (!items.length) return [{ kind: 'text', text: content }];

  const withPos = items
    .map((it) => {
      const pos = content.toLowerCase().indexOf(it.original.toLowerCase());
      return { ...it, pos };
    })
    .filter((it) => it.pos !== -1)
    .sort((a, b) => a.pos - b.pos);

  const chosen = [];
  let boundary = 0;
  for (const it of withPos) {
    if (it.pos < boundary) continue;
    chosen.push(it);
    boundary = it.pos + it.originalLen;
  }

  const segments = [];
  let lastEnd = 0;
  for (const it of chosen) {
    if (it.pos > lastEnd) segments.push({ kind: 'text', text: content.slice(lastEnd, it.pos) });
    segments.push({
      kind: 'error',
      id: it.id,
      errorType: it.errorType,
      text: content.slice(it.pos, it.pos + it.originalLen),
      explanation: it.explanation,
      suggestion: it.suggestion,
    });
    lastEnd = it.pos + it.originalLen;
  }
  if (lastEnd < content.length) segments.push({ kind: 'text', text: content.slice(lastEnd) });
  return segments.length ? segments : [{ kind: 'text', text: content }];
}

/** Error highlighting inside a single paragraph (draft). */
function highlightDraft(paragraphText, errors, { setTooltip, keyPrefix = 'd' }) {
  const segments = buildDraftErrorSegments(paragraphText || '', errors);
  return segments.map((seg, i) => {
    if (seg.kind !== 'error') {
      return <span key={`${keyPrefix}-t-${i}`}>{seg.text}</span>;
    }
    const cls = ERROR_SPAN_CLASS[seg.errorType] || ERROR_SPAN_CLASS.grammar;
    const tip = [seg.explanation, seg.suggestion].filter(Boolean).join(' — ');
    return (
      <span
        key={`${keyPrefix}-${seg.id}-${i}`}
        className={`rounded-sm ${cls}`}
        title={tip || undefined}
        onMouseEnter={(e) => {
          if (!tip) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltip({
            show: true,
            text: tip,
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
        }}
        onMouseLeave={() => setTooltip((t) => ({ ...t, show: false }))}
      >
        {seg.text}
      </span>
    );
  });
}

/** AI wraps upgrades in <mark>...</mark>; parsed without innerHTML. */
const MARK_PAIR_RE = /<mark>([\s\S]*?)<\/mark>/gi;

const MARK_HIGHLIGHT_CLASS_TASK2 =
  'bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-sm border-b-2 border-amber-300 font-medium dark:bg-amber-900/40 dark:text-amber-100';

const MARK_HIGHLIGHT_CLASS_TASK1 =
  'bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded-sm border-b-2 border-emerald-200 font-medium dark:bg-emerald-900/40 dark:text-emerald-100';

const REWRITE_SPAN_CLASS = {
  connectors:
    'bg-sky-100 text-sky-900 px-1 py-0.5 rounded-sm border-b border-sky-200 font-semibold dark:bg-sky-900/25 dark:text-sky-200',
  advanced:
    'bg-amber-100/60 text-amber-900 px-1 py-0.5 rounded-sm border-b border-amber-200 font-medium dark:bg-amber-900/20 dark:text-amber-200',
};

const CONNECTOR_PHRASES_T1 = [
  'Overall',
  'In conclusion',
  'To conclude',
  'In summary',
  'It is clear that',
  'It can be seen that',
  'The graph illustrates',
  'The bar chart illustrates',
  'The table illustrates',
  'The diagram illustrates',
  'The line graph illustrates',
  'The pie chart illustrates',
];

const CONNECTOR_PHRASES_T2 = [
  'On the one hand',
  'On the other hand',
  'In conclusion',
  'To conclude',
  'In summary',
  'Overall',
  'However',
  'Nevertheless',
  'Moreover',
  'Furthermore',
  'Therefore',
  'Thus',
  'Consequently',
  'In addition',
  'For example',
  'For instance',
  'In contrast',
  'By contrast',
  'As a result',
];

const ADVANCED_STOPWORDS_COMMON = new Set(
  [
    'whatever',
    'whenever',
    'wherever',
    'everyone',
    'everything',
    'anything',
    'something',
    'somewhere',
    'themselves',
    'ourselves',
    'yourselves',
    'theoretically',
  ].map((s) => s.toLowerCase())
);

// Task 1 often contains technical nouns (percentages, categories); be a bit stricter to reduce noise.
const ADVANCED_STOPWORDS_T1 = new Set(
  [
    ...ADVANCED_STOPWORDS_COMMON,
    'percentage',
    'percentages',
    'information',
    'production',
    'population',
    'development',
    'government',
    'technology',
    'university',
  ].map((s) => s.toLowerCase())
);

// Task 2 tends to reward academic lexis more broadly; keep fewer exclusions.
const ADVANCED_STOPWORDS_T2 = new Set(
  [
    ...ADVANCED_STOPWORDS_COMMON,
    'international',
    'environmental',
  ].map((s) => s.toLowerCase())
);

function splitByPhrases(text, phrases, type) {
  if (!text) return [{ kind: 'text', text: '' }];
  const sorted = (Array.isArray(phrases) ? phrases : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!sorted.length) return [{ kind: 'text', text }];

  const lower = text.toLowerCase();
  const phrasesLower = sorted.map((p) => p.toLowerCase());
  const segments = [];
  let i = 0;
  let buf = '';

  while (i < text.length) {
    let matched = false;
    for (let pi = 0; pi < phrasesLower.length; pi++) {
      const pl = phrasesLower[pi];
      if (pl && lower.startsWith(pl, i)) {
        if (buf) {
          segments.push({ kind: 'text', text: buf });
          buf = '';
        }
        segments.push({ kind: 'span', type, text: text.slice(i, i + pl.length) });
        i += pl.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      buf += text[i];
      i += 1;
    }
  }

  if (buf) segments.push({ kind: 'text', text: buf });
  return segments.length ? segments : [{ kind: 'text', text }];
}

function splitByAdvancedWords(text, { minLen, stopwords }) {
  if (!text) return [{ kind: 'text', text: '' }];
  // slightly stricter than \w: only letters, to avoid ids / numbers
  const safeMin = Number.isFinite(minLen) ? Math.max(1, Math.floor(minLen)) : 9;
  const re = new RegExp(`\\b[a-zA-Z]{${safeMin},}\\b`, 'g');
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const w = m[0];
    const wl = w.toLowerCase();
    if (stopwords?.has?.(wl)) continue;
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    out.push({ kind: 'span', type: 'advanced', text: w });
    last = m.index + w.length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out.length ? out : [{ kind: 'text', text }];
}

/**
 * Priority:
 * - existing <mark>...</mark> phrases
 * - task-specific connector phrases
 * - auto-highlight remaining long academic words (>= 9 letters) as `advanced`
 */
function getRewriteSegments(paragraphText, activeTab) {
  const raw = paragraphText == null ? '' : String(paragraphText);
  if (!raw) return [{ kind: 'text', text: '' }];

  const phrases = activeTab === 'Task 1' ? CONNECTOR_PHRASES_T1 : CONNECTOR_PHRASES_T2;
  const advancedCfg =
    activeTab === 'Task 1'
      ? { minLen: 10, stopwords: ADVANCED_STOPWORDS_T1 }
      : { minLen: 9, stopwords: ADVANCED_STOPWORDS_T2 };

  // 1) split on <mark>...</mark>
  const base = [];
  let last = 0;
  let m;
  const re = new RegExp(MARK_PAIR_RE.source, MARK_PAIR_RE.flags);
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) base.push({ kind: 'text', text: raw.slice(last, m.index) });
    base.push({ kind: 'span', type: 'rewrite_mark', text: m[1] });
    last = re.lastIndex;
  }
  if (last < raw.length) base.push({ kind: 'text', text: raw.slice(last) });

  // 2) split remaining text by connector phrases
  const withConnectors = base.flatMap((seg) => {
    if (seg.kind !== 'text') return [seg];
    return splitByPhrases(seg.text, phrases, 'connectors');
  });

  // 3) split remaining plain text by long words
  const withAdvanced = withConnectors.flatMap((seg) => {
    if (seg.kind !== 'text') return [seg];
    return splitByAdvancedWords(seg.text, advancedCfg);
  });

  return withAdvanced.length ? withAdvanced : [{ kind: 'text', text: raw }];
}

/**
 * Split rewrite text on <mark>...</mark> and return JSX fragments.
 * Unclosed or stray tags are left as plain text (no HTML injection).
 */
function renderHighlightedText(paragraphText, activeTab, keyPrefix = 'r') {
  const markClass =
    activeTab === 'Task 1' ? MARK_HIGHLIGHT_CLASS_TASK1 : MARK_HIGHLIGHT_CLASS_TASK2;
  const segs = getRewriteSegments(paragraphText, activeTab);
  let i = 0;
  return segs.map((seg) => {
    if (seg.kind !== 'span') {
      return <span key={`${keyPrefix}-t-${i++}`}>{seg.text}</span>;
    }
    if (seg.type === 'rewrite_mark') {
      return (
        <mark key={`${keyPrefix}-m-${i++}`} className={markClass}>
          {seg.text}
        </mark>
      );
    }
    const cls = REWRITE_SPAN_CLASS[seg.type] || '';
    return (
      <span key={`${keyPrefix}-s-${i++}`} className={cls}>
        {seg.text}
      </span>
    );
  });
}

/** Longform essay body — premium editorial rhythm */
const PARA_ESSAY =
  'mb-8 text-justify font-serif text-lg font-normal leading-[1.9] last:mb-0 text-slate-800 dark:text-slate-200';

/** Right-column rewrite: magazine-style longform (left-aligned, no justified rivers) */
const PARA_ESSAY_REWRITE =
  'mb-8 font-serif text-[1.125rem] leading-[1.9] text-left text-slate-800 dark:text-slate-200 last:mb-0';

/** Drop cap: first paragraph only — full text stays in DOM; styling via ::first-letter */
const DROP_CAP_CLASS =
  'md:first-letter:text-6xl md:first-letter:font-black md:first-letter:text-indigo-600 md:first-letter:float-left md:first-letter:mr-3 md:first-letter:leading-[0.8] md:first-letter:mt-2';

const LEGEND_ITEMS = [
  { key: 'grammar', label: 'Grammar', dot: 'bg-rose-500' },
  { key: 'vocab', label: 'Vocabulary', dot: 'bg-purple-500' },
  { key: 'logic', label: 'Logic/Data', dot: 'bg-blue-600' },
  { key: 'connectors', label: 'Connectors', dot: 'bg-sky-400' },
  { key: 'advanced', label: 'Advanced Vocabulary', dot: 'bg-amber-200' },
  { key: 'rewrite_mark', label: 'Rewrite highlights (<mark>)', dot: 'bg-amber-400' },
];

function buildInsightsLines(activeResult, activeTab) {
  const raw = activeResult?.insights;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((x) =>
        typeof x === 'string' ? x : (x?.text ?? x?.label ?? x?.title ?? String(x ?? ''))
      )
      .filter(Boolean);
  }

  const criteria = activeResult?.criteria || {};
  const taskKey = activeTab === 'Task 1' ? 'Task_Achievement' : 'Task_Response';
  const lines = [];

  const pushComment = (label, block) => {
    if (!block) return;
    const c = block.comment;
    if (typeof c === 'string' && c.trim()) {
      const t = c.trim();
      lines.push(`${label}: ${t.slice(0, 140)}${t.length > 140 ? '…' : ''}`);
    } else if (block.score != null && block.score !== '') {
      lines.push(`${label}: ${Number(block.score).toFixed(1)}`);
    }
  };

  pushComment(activeTab === 'Task 1' ? 'Task achievement' : 'Task response', criteria[taskKey]);
  pushComment('Coherence & cohesion', criteria.Coherence_and_Cohesion);
  pushComment('Lexical resource', criteria.Lexical_Resource);
  pushComment('Grammar', criteria.Grammatical_Range_and_Accuracy);

  if (lines.length) return lines.slice(0, 6);

  return [
    'Academic register and objective tone',
    'Clear logical progression',
    'Strong lexical precision',
  ];
}

export default function ComparisonLab({ activeTab, activeResult, darkMode, className = '' }) {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const draftText =
    (typeof activeResult?.text === 'string' && activeResult.text) ||
    (typeof activeResult?.content === 'string' && activeResult.content) ||
    '';

  const suggestedRewrite = activeResult?.suggested_rewrite || '';
  const errors = Array.isArray(activeResult?.errors) ? activeResult.errors : [];

  const draftParagraphs = useMemo(() => splitEssayIntoParagraphs(draftText), [draftText]);
  const rewriteParagraphs = useMemo(() => splitEssayIntoParagraphs(suggestedRewrite), [suggestedRewrite]);

  const insightsLines = useMemo(
    () => buildInsightsLines(activeResult, activeTab),
    [activeResult, activeTab]
  );

  const draftBandLabel = useMemo(() => {
    const b = activeResult?.overall_band;
    if (b != null && b !== '' && Number.isFinite(Number(b))) return `Band ${Number(b).toFixed(1)}`;
    return activeTab === 'Task 1' ? 'Band 5.0' : 'Band 5.5';
  }, [activeResult?.overall_band, activeTab]);

  const rewriteBandLabel = 'Band 8.5+';

  const borderTone = darkMode ? 'border-slate-800' : 'border-slate-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden rounded-[3rem] border ${borderTone} bg-white dark:bg-slate-950 ${className}`}
    >
      <div className="p-8 sm:p-12">
        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-200/90 via-80% to-transparent md:block dark:from-transparent dark:via-slate-600/85 dark:to-transparent"
            aria-hidden
          />
          <div className="pointer-events-none absolute left-1/2 top-32 z-20 hidden -translate-x-1/2 md:flex">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black tracking-[0.2em] text-slate-600 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              VS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-0 md:items-start">
            {/* DRAFT */}
            <div className="relative z-10 flex min-h-[12rem] flex-col md:pr-10">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                DRAFT ORIGINAL
              </p>
              <div className="flex flex-1 flex-col">
                {draftParagraphs.length === 0 ? (
                  <p className={PARA_ESSAY} />
                ) : (
                  draftParagraphs.map((para, i) => {
                    const conclusion = isConclusionParagraph(para);
                    return (
                      <p
                        key={`draft-p-${i}`}
                        className={`${PARA_ESSAY} ${conclusion ? 'mt-10 italic' : ''}`}
                      >
                        {highlightDraft(para, errors, { setTooltip, keyPrefix: `d-${i}` })}
                      </p>
                    );
                  })
                )}
              </div>
              <p className="mt-6 text-xs font-semibold tracking-tight text-slate-400 dark:text-slate-500">
                {draftBandLabel}
              </p>
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[9px] font-black tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                VS
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* ACADEMIC REWRITE */}
            <div className="relative z-10 flex min-h-[12rem] flex-col md:col-start-2 md:row-start-1 md:pl-10">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                ACADEMIC SUGGESTED REWRITE
              </p>
              <div className="flex min-w-0 flex-1 flex-col">
                {rewriteParagraphs.length === 0 ? (
                  <p className={PARA_ESSAY_REWRITE} />
                ) : (
                  rewriteParagraphs.map((para, i) => {
                    const conclusion = isConclusionParagraph(para);
                    const isFirstBody = i === 0;
                    return (
                      <p
                        key={`rewrite-p-${i}`}
                        className={`${PARA_ESSAY_REWRITE} ${isFirstBody ? DROP_CAP_CLASS : ''} ${
                          conclusion ? 'mt-12 italic border-t border-slate-100 pt-6 dark:border-slate-800' : ''
                        }`}
                      >
                        {renderHighlightedText(para, activeTab, `r-${i}`)}
                      </p>
                    );
                  })
                )}
              </div>
              <p className="mt-6 text-xs font-semibold text-emerald-600 dark:text-emerald-400 lg:mt-4">
                {rewriteBandLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-3">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            Legend:
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGEND_ITEMS.map(({ key, label, dot }) => (
              <span
                key={key}
                className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {tooltip.show && tooltip.text && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-xl dark:bg-slate-800"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}
    </motion.div>
  );
}
