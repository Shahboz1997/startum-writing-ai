'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const DRAFT =
  "I think that technology is good for education. It helps students learn things faster and it is easy to find information on the internet. But some people say it is bad because students get lazy. Also, teachers don't need to talk much if there are computers. In the end, I believe technology is very helpful for everyone in schools.";

const REWRITE =
  'It is widely argued that the integration of digital technology has revolutionized the modern educational landscape. While critics maintain that an over-reliance on digital devices may induce intellectual passivity among learners, I assert that instantaneous access to vast information repositories significantly enhances research efficiency. Furthermore, pedagogical roles are evolving as educators transition from traditional lecturers to facilitators of digital literacy. Ultimately, when implemented strategically, technological tools serve as indispensable assets that foster an inclusive and dynamic learning environment.';

const REWRITE_HIGHLIGHTS = [
  { text: 'It is widely argued that', type: 'connector' },
  { text: 'While', type: 'connector' },
  { text: 'Furthermore', type: 'connector' },
  { text: 'Ultimately', type: 'connector' },
  { text: 'revolutionized', type: 'verb' },
  { text: 'induce', type: 'verb' },
  { text: 'assert', type: 'verb' },
  { text: 'foster', type: 'verb' },
  { text: 'intellectual passivity', type: 'noun' },
  { text: 'information repositories', type: 'noun' },
  { text: 'pedagogical roles', type: 'noun' },
];

/** Draft weak spots with upgrade hints (hover). */
const DRAFT_HIGHLIGHTS = [
  { text: 'I think', type: 'grammar', suggestion: '→ It is widely argued that' },
  { text: 'good', type: 'vocabulary', suggestion: '→ beneficial / positive' },
  { text: 'easy', type: 'vocabulary', suggestion: '→ straightforward / readily' },
  { text: 'bad', type: 'vocabulary', suggestion: '→ detrimental / counterproductive' },
  { text: 'lazy', type: 'vocabulary', suggestion: '→ intellectually passive' },
  { text: "don't need", type: 'grammar', suggestion: '→ need not / are no longer required to' },
  { text: 'In the end', type: 'grammar', suggestion: '→ Ultimately' },
  { text: 'very helpful', type: 'vocabulary', suggestion: '→ highly beneficial / indispensable' },
];

function getOriginalSegments(text) {
  const segments = [];
  const lower = text.toLowerCase();
  let i = 0;
  let normalBuf = '';
  while (i < text.length) {
    let matched = false;
    for (const h of DRAFT_HIGHLIGHTS) {
      const phrase = h.text;
      if (lower.substring(i).startsWith(phrase.toLowerCase())) {
        if (normalBuf.length) {
          segments.push({ text: normalBuf, type: null });
          normalBuf = '';
        }
        segments.push({ text: text.slice(i, i + phrase.length), type: h.type, suggestion: h.suggestion });
        i += phrase.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      normalBuf += text[i];
      i += 1;
    }
  }
  if (normalBuf.length) segments.push({ text: normalBuf, type: null });
  return segments.length ? segments : [{ text, type: null }];
}

function getImprovedSegments(text, highlights) {
  const byStart = [];
  highlights.forEach((h) => {
    let pos = 0;
    let idx;
    while ((idx = text.indexOf(h.text, pos)) !== -1) {
      byStart.push({ start: idx, end: idx + h.text.length, type: h.type, text: h.text });
      pos = idx + 1;
    }
  });
  byStart.sort((a, b) => a.start - b.start);
  const merged = [];
  byStart.forEach((h) => {
    const overlap = merged.some((m) => h.start < m.end && h.end > m.start);
    if (!overlap) merged.push(h);
  });
  const segments = [];
  let last = 0;
  merged.forEach(({ start, end, type, text: phrase }) => {
    if (start > last) segments.push({ text: text.slice(last, start), type: null });
    segments.push({ text: phrase, type });
    last = end;
  });
  if (last < text.length) segments.push({ text: text.slice(last), type: null });
  return segments.length ? segments : [{ text, type: null }];
}

const highlightStyles = {
  connector: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100',
  verb: 'bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100',
  noun: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100',
};

/**
 * Compact Task 2 draft vs model rewrite. Illustrative only — not a promised band outcome.
 */
export default function Task2ComparisonLab() {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const originalSegments = getOriginalSegments(DRAFT);
  const improvedSegments = getImprovedSegments(REWRITE, REWRITE_HIGHLIGHTS);

  const showTip = (e, suggestion) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ show: true, text: suggestion, x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12" aria-labelledby="task2-compare-heading">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Task 2 · Draft vs rewrite
          </p>
          <h2
            id="task2-compare-heading"
            className="mt-2 text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white sm:text-2xl"
          >
            See how a model rewrite upgrades Task 2
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Hover red/indigo words on the draft for upgrade hints. Example only — not a promised band jump.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-white/5"
        >
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex flex-col p-4 sm:p-5">
              <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                Draft · weak register
              </span>
              <p className="flex-1 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                &ldquo;
                {originalSegments.map((seg, i) =>
                  seg.type === 'grammar' || seg.type === 'vocabulary' ? (
                    <span
                      key={i}
                      className={
                        seg.type === 'grammar'
                          ? 'cursor-help rounded bg-red-100 px-0.5 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'cursor-help rounded bg-indigo-100 px-0.5 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                      }
                      onMouseEnter={(e) => showTip(e, seg.suggestion)}
                      onMouseLeave={() => setTooltip((t) => ({ ...t, show: false }))}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
                &rdquo;
              </p>
            </div>

            <div className="flex flex-col p-4 sm:p-5">
              <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Model rewrite · example
              </span>
              <p className="flex-1 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                &ldquo;
                {improvedSegments.map((seg, i) =>
                  seg.type ? (
                    <span
                      key={i}
                      className={`rounded-sm px-0.5 ${highlightStyles[seg.type] ?? 'bg-slate-100 dark:bg-slate-700'}`}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
                &rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Legend</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-300 dark:bg-red-600" aria-hidden /> Grammar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-300 dark:bg-indigo-600" aria-hidden /> Vocabulary
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-800" aria-hidden /> Connectors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-violet-200 dark:bg-violet-800" aria-hidden /> Verbs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-200 dark:bg-amber-800" aria-hidden /> Nouns
            </span>
          </div>

          <div className="border-t border-slate-100 px-4 py-3 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Full reports include criteria scores, fixes, and a rewrite like this. Try your essay with Check free
              above.
            </p>
          </div>
        </motion.div>
      </div>

      {tooltip.show && tooltip.text ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-xl dark:border-slate-600 dark:bg-slate-700"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      ) : null}
    </section>
  );
}
