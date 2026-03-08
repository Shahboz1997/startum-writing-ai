'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const task2FullData = {
  original:
    "I think that technology is good for education. It helps students learn things faster and it is easy to find information on the internet. But some people say it is bad because students get lazy. Also, teachers don't need to talk much if there are computers. In the end, I believe technology is very helpful for everyone in schools.",
  improved:
    "It is widely argued that the integration of digital technology has revolutionized the modern educational landscape. While critics maintain that an over-reliance on digital devices may induce intellectual passivity among learners, I assert that instantaneous access to vast information repositories significantly enhances research efficiency. Furthermore, pedagogical roles are evolving as educators transition from traditional lecturers to facilitators of digital literacy. Ultimately, when implemented strategically, technological tools serve as indispensable assets that foster an inclusive and dynamic learning environment.",
  // Spec: Connectors (Indigo) | Academic Verbs (Purple) | Advanced Nouns (Amber)
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
  stats: { original: 'Band 5.0', improved: 'Band 8.5+' },
};

const WEAK_PHRASES = [
  'I think',
  'good',
  'easy',
  'bad',
  'lazy',
  "don't need",
  'In the end',
  'very helpful',
];

function getOriginalSegments(text) {
  const segments = [];
  const lower = text.toLowerCase();
  let i = 0;
  let normalBuf = '';
  while (i < text.length) {
    let matched = false;
    for (const phrase of WEAK_PHRASES) {
      if (lower.substring(i).startsWith(phrase.toLowerCase())) {
        if (normalBuf.length) {
          segments.push({ text: normalBuf, weak: false });
          normalBuf = '';
        }
        segments.push({ text: text.slice(i, i + phrase.length), weak: true });
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
  if (normalBuf.length) segments.push({ text: normalBuf, weak: false });
  return segments.length ? segments : [{ text, weak: false }];
}

function getImprovedSegments(text, highlights, deepAnalysisOn) {
  if (!deepAnalysisOn) return [{ text, type: null }];
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
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const copyImproved = useCallback(() => {
    navigator.clipboard?.writeText(task2FullData.improved).then(() => {
      setCopied(true);
      setToastVisible(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setToastVisible(false), 2000);
    });
  }, []);

  const originalSegments = getOriginalSegments(task2FullData.original);
  const improvedSegments = getImprovedSegments(task2FullData.improved, task2FullData.highlights, deepAnalysis);

  const container = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  };
  const leftPanel = {
    initial: { opacity: 0, x: -24 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay: 0.1 },
  };
  const rightPanel = {
    initial: { opacity: 0, x: 24 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay: 0.15 },
  };

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto">
      <motion.div {...container} className="text-center mb-4 sm:mb-6">
        <span className="tagline-pill mb-2 block w-fit mx-auto">Flagship</span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        IELTS Task 2.  <span className="text-indigo-600 dark:text-indigo-400">Academic Elite</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 max-w-2xl mx-auto leading-relaxed">
          Deep analysis view: draft vs academic version with linguistic structure highlights.
        </p>
      </motion.div>

      <motion.div
        {...container}
        className="relative rounded-3xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 shadow-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden"
      >
        {/* VS badge — visible on all breakpoints */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 pointer-events-none">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm">
            VS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-700/50">
          {/* Left — Draft */}
          <motion.div
            {...leftPanel}
            className="p-5 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-slate-900/50 min-h-[200px] flex flex-col"
          >
            <div className="mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Draft · Original
              </span>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-slate-400 dark:text-slate-500 font-medium flex-1">
              &ldquo;
              {originalSegments.map((seg, i) =>
                seg.weak ? (
                  <span
                    key={i}
                    className="text-red-400 dark:text-red-500/90 line-through decoration-red-400 dark:decoration-red-500/80"
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
              &rdquo;
            </p>
            <div className="mt-3 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {task2FullData.stats.original}
            </div>
          </motion.div>

          {/* Right — Academic + metadata + highlighter + sidebar */}
          <motion.div {...rightPanel} className="p-5 sm:p-6 lg:p-8 bg-white dark:bg-slate-800/40 min-h-[200px] flex flex-col relative">
            {/* Success toast */}
            <AnimatePresence>
              {toastVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 right-4 z-20 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  Copied to clipboard
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Academic · Improved
              </span>
              <button
                type="button"
                onClick={copyImproved}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-xs font-medium"
                aria-label="Copy improved version"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> Copy Improved Version
                  </>
                )}
              </button>
            </div>
            {/* Metadata badges */}
            <div className="flex flex-wrap gap-1.5 mb-3 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                CEFR: C1/C2
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                Tone: Formal
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                Lexical Density: 0.82
              </span>
            </div>

            {/* Toggle: Deep Structure Analysis */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                role="switch"
                aria-checked={deepAnalysis}
                onClick={() => setDeepAnalysis((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  deepAnalysis
                    ? 'border-indigo-500 bg-indigo-600'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    deepAnalysis ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Deep Structure Analysis</span>
            </div>

            <div className="flex gap-4 flex-1">
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  &ldquo;
                  {improvedSegments.length === 1 && !improvedSegments[0].type ? (
                    improvedSegments[0].text
                  ) : (
                    improvedSegments.map((seg, i) =>
                      seg.type ? (
                        <span
                          key={i}
                          className={`rounded-sm px-0.5 ${highlightStyles[seg.type] ?? 'bg-slate-100'}`}
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      )
                    )
                  )}
                  &rdquo;
                </p>
              </div>
              {/* Examiner Insights sidebar */}
              <div className="hidden sm:flex flex-col w-40 shrink-0 pl-4 border-l border-slate-100 dark:border-slate-700/50">
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

            <div className="mt-3 text-[10px] font-semibold text-red-500">{task2FullData.stats.improved}</div>
          </motion.div>
        </div>

        {/* Legend — when Deep Structure Analysis is ON */}
        {deepAnalysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 sm:px-6 lg:px-8 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/30 flex flex-wrap items-center gap-4 text-xs"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-400">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-800" /> Connectors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-800" /> Academic Verbs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800" /> Advanced Nouns
            </span>
          </motion.div>
        )}

        {/* Mobile: Examiner insights below */}
        <div className="sm:hidden px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/30">
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
    </section>
  );
}
