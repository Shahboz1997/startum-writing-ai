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

function isConclusionParagraph(text) {
  return /^\s*In conclusion\b/i.test(String(text || ''));
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

const T2_REWRITE_PHRASES = [
  {
    type: 'connector',
    phrases: [
      'It is widely argued that',
      'While',
      'Furthermore',
      'Ultimately',
      'Moreover',
      'Conversely',
      'Nevertheless',
    ],
  },
  {
    type: 'verb',
    phrases: [
      'revolutionized',
      'induce',
      'assert',
      'foster',
      'maintain',
      'enhances',
      'transition',
    ],
  },
  {
    type: 'noun',
    phrases: [
      'intellectual passivity',
      'information repositories',
      'pedagogical roles',
      'learning environment',
      'digital literacy',
      'research efficiency',
    ],
  },
];

const T1_REWRITE_PHRASES = [
  {
    type: 'connector',
    phrases: ['In contrast', 'Compared to', 'By comparison', 'Whereas', 'While'],
  },
  {
    type: 'noun',
    phrases: [
      'significantly',
      'substantially',
      'steadily',
      'gradually',
      'peaked',
      'plateaued',
      'fluctuated',
    ],
  },
];

const REWRITE_SPAN_CLASS = {
  connector:
    'rounded-sm bg-sky-500/10 font-semibold text-sky-950 underline decoration-sky-600/60 decoration-2 underline-offset-2 dark:bg-sky-500/10 dark:text-sky-100 dark:decoration-sky-400/60',
  verb:
    'rounded-sm bg-purple-500/10 font-semibold text-purple-950 underline decoration-purple-600/60 decoration-2 underline-offset-2 dark:bg-purple-500/10 dark:text-purple-100 dark:decoration-purple-400/60',
  noun:
    'rounded-sm bg-yellow-400/10 font-semibold text-yellow-950 underline decoration-yellow-600/60 decoration-2 underline-offset-2 dark:bg-yellow-400/10 dark:text-yellow-100 dark:decoration-yellow-400/60',
};

function getRewriteSegments(text, activeTab) {
  if (!text || !text.trim()) return [{ text: text || '', type: null }];
  const byStart = [];
  const source = activeTab === 'Task 1' ? T1_REWRITE_PHRASES : T2_REWRITE_PHRASES;
  source.forEach(({ type, phrases }) => {
    phrases.forEach((phrase) => {
      let pos = 0;
      let idx;
      while ((idx = text.indexOf(phrase, pos)) !== -1) {
        byStart.push({ start: idx, end: idx + phrase.length, type, phrase });
        pos = idx + 1;
      }
    });
  });
  byStart.sort((a, b) => a.start - b.start);
  const merged = [];
  byStart.forEach((h) => {
    const overlap = merged.some((m) => h.start < m.end && h.end > m.start);
    if (!overlap) merged.push(h);
  });
  const segments = [];
  let last = 0;
  merged.forEach(({ start, end, type, phrase }) => {
    if (start > last) segments.push({ text: text.slice(last, start), type: null });
    segments.push({ text: phrase, type });
    last = end;
  });
  if (last < text.length) segments.push({ text: text.slice(last), type: null });
  return segments.length ? segments : [{ text, type: null }];
}

/** Connector / lexical lift highlighting inside one rewrite paragraph. */
function highlightRewrite(paragraphText, activeTab, keyPrefix = 'r') {
  const segs = getRewriteSegments(paragraphText || '', activeTab);
  return segs.map((seg, i) => {
    if (!seg.type || !REWRITE_SPAN_CLASS[seg.type]) {
      return <span key={`${keyPrefix}-t-${i}`}>{seg.text}</span>;
    }
    return (
      <span key={`${keyPrefix}-h-${i}`} className={REWRITE_SPAN_CLASS[seg.type]}>
        {seg.text}
      </span>
    );
  });
}

/** Longform essay body — premium editorial rhythm */
const PARA_ESSAY =
  'mb-8 text-justify font-serif text-lg font-normal leading-[1.9] last:mb-0 text-slate-800 dark:text-slate-200';

/** Drop cap: first letter of suggested rewrite, desktop only */
const DROP_CAP_CLASS =
  'md:first-letter:float-left md:first-letter:mr-3 md:first-letter:leading-none md:first-letter:font-black md:first-letter:text-5xl md:first-letter:text-indigo-600 dark:md:first-letter:text-indigo-400';

const LEGEND_ITEMS = [
  { key: 'grammar', label: 'Grammar', dot: 'bg-rose-500' },
  { key: 'vocab', label: 'Vocabulary', dot: 'bg-purple-500' },
  { key: 'logic', label: 'Logic/Data', dot: 'bg-blue-600' },
  { key: 'connectors', label: 'Connectors', dot: 'bg-sky-400' },
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
        <div className="mb-10 mt-8 w-full">
          <div className="mb-5 flex items-center gap-3">
            <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              AI Insights & Improvements
            </p>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {insightsLines.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white/50 p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/40"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </div>
                <span className="text-[13px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-8 left-1/2 top-12 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-300/90 via-50% to-transparent md:block dark:from-transparent dark:via-slate-600/85 dark:to-transparent"
            aria-hidden
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
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
            <div className="relative z-10 flex min-h-[12rem] flex-col md:col-start-2 md:row-start-1 md:border-l md:border-slate-200/60 md:pl-8 md:pl-10 dark:md:border-slate-700/60">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                ACADEMIC SUGGESTED REWRITE
              </p>
              <div className="flex min-w-0 flex-1 flex-col">
                {rewriteParagraphs.length === 0 ? (
                  <p className={PARA_ESSAY} />
                ) : (
                  rewriteParagraphs.map((para, i) => {
                    const conclusion = isConclusionParagraph(para);
                    const isFirstBody = i === 0;
                    return (
                      <p
                        key={`rewrite-p-${i}`}
                        className={`${PARA_ESSAY} ${isFirstBody ? DROP_CAP_CLASS : ''} ${
                          conclusion ? 'mt-10 italic' : ''
                        }`}
                      >
                        {highlightRewrite(para, activeTab, `r-${i}`)}
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
