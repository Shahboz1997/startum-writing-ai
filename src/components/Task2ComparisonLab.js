'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const task2FullData = {
  original:
    "I think that technology is good for education. It helps students learn things faster and it is easy to find information on the internet. But some people say it is bad because students get lazy. Also, teachers don't need to talk much if there are computers. In the end, I believe technology is very helpful for everyone in schools.",
  improved:
    "It is widely argued that the integration of digital technology has revolutionized the modern educational landscape. While critics maintain that an over-reliance on digital devices may induce intellectual passivity among learners, I assert that instantaneous access to vast information repositories significantly enhances research efficiency. Furthermore, pedagogical roles are evolving as educators transition from traditional lecturers to facilitators of digital literacy. Ultimately, when implemented strategically, technological tools serve as indispensable assets that foster an inclusive and dynamic learning environment.",
  highlights: [
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
  ],
  stats: { original: 'Band 5.5', improved: 'Band 8.5' },
};

/** Band 5.5 left panel: grammar (red) and vocabulary (indigo) with tooltip suggestions */
const BAND_55_HIGHLIGHTS = [
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
    for (const h of BAND_55_HIGHLIGHTS) {
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

const EXAMINER_INSIGHTS = [
  'Zero personal pronouns used',
  'Complex nominalization detected',
  'Logical cohesion: 9.0',
];

const highlightStyles = {
  connector: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100',
  verb: 'bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100',
  noun: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100',
};

export default function Task2ComparisonLab({ darkMode }) {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  const originalSegments = getOriginalSegments(task2FullData.original);
  const improvedSegments = getImprovedSegments(task2FullData.improved, task2FullData.highlights);

  const container = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  };
  const leftPanel = {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, delay: 0.1 },
  };
  const rightPanel = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, delay: 0.15 },
  };

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6">
      <motion.div {...container} className="max-w-6xl mx-auto">
        {/* STRATUM label */}
        <p className="font-black uppercase tracking-[0.3em] text-indigo-500 text-center mb-6 text-[11px] sm:text-xs">
          NEURAL STRATA MAPPING
        </p>

        <motion.div
          {...container}
          className="relative rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 bg-slate-900/20 dark:bg-slate-900/30 backdrop-blur-3xl shadow-2xl overflow-hidden pointer-events-none"
        >
          {/* VS badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 pointer-events-none">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200/90 dark:bg-slate-600/90 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm backdrop-blur-sm">
              VS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60 dark:divide-white/10">
            {/* Left — Band 5.5 with Grammar (red) & Vocabulary (indigo) always visible */}
            <motion.div
              {...leftPanel}
              className="relative p-5 sm:p-6 lg:p-8 bg-slate-50/80 dark:bg-slate-900/40 min-h-[200px] flex flex-col transition-shadow duration-300 hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.2)]"
            >
              <div className="mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Draft · Original
                </span>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium flex-1">
                &ldquo;
                {originalSegments.map((seg, i) =>
                  seg.type === 'grammar' ? (
                    <span
                      key={i}
                      className="relative inline cursor-default bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-0.5 border-b-2 border-red-400 dark:border-red-500/80 pointer-events-auto"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ show: true, text: seg.suggestion, x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip((t) => ({ ...t, show: false }))}
                    >
                      {seg.text}
                    </span>
                  ) : seg.type === 'vocabulary' ? (
                    <span
                      key={i}
                      className="relative inline cursor-default bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 rounded px-0.5 border-b-2 border-indigo-400 dark:border-indigo-500/80 pointer-events-auto"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ show: true, text: seg.suggestion, x: rect.left + rect.width / 2, y: rect.top });
                      }}
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
              <div className="mt-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {task2FullData.stats.original}
              </div>
            </motion.div>

            {/* Right — Band 8.5 Suggested Rewrite, highlights always on */}
            <motion.div
              {...rightPanel}
              className="relative p-5 sm:p-6 lg:p-8 bg-white/60 dark:bg-slate-800/30 min-h-[200px] flex flex-col transition-shadow duration-300 hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_40px_-8px_rgba(99,102,241,0.2)]"
            >
              <div className="mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Academic · Suggested Rewrite
                </span>
              </div>
              <div className="flex gap-4 flex-1 min-h-0">
                <div className="flex-1 min-w-0">
                  <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
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
                <div className="hidden sm:flex flex-col w-40 shrink-0 pl-4 border-l border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Insights
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {EXAMINER_INSIGHTS.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {task2FullData.stats.improved}
              </div>
            </motion.div>
          </div>

          {/* Legend — always visible (static demo) */}
          <div className="px-5 sm:px-6 lg:px-8 py-3 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/30 flex flex-wrap items-center justify-center gap-6 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-600" /> Grammar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-600" /> Vocabulary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-800" /> Connectors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-800" /> Academic Verbs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800" /> Advanced Nouns
            </span>
          </div>

          {/* Mobile: Examiner insights below */}
          <div className="sm:hidden px-5 pb-5 pt-3 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/30">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2">
              Insights
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {EXAMINER_INSIGHTS.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 dark:text-emerald-400 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>

      {/* Global tooltip for highlight hover */}
      {tooltip.show && tooltip.text && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium shadow-xl border border-slate-700 dark:border-slate-600 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}
    </section>
  );
}
