'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const ORIGINAL_SEGMENTS = [
  { text: 'The graph shows that the number of people who ' },
  { text: 'go to the cinema', error: true, tip: 'Informal phrasing — weakens Task Achievement precision.' },
  { text: ' increased. ' },
  { text: 'It was low', error: true, tip: 'Vague description — misses Lexical Resource range.' },
  { text: ' in 1990 and then it ' },
  { text: 'went up high', error: true, tip: 'Basic verb phrase — Band 5–6 lexis.' },
  { text: ' in 2010. Also, more young people ' },
  { text: 'like movies', error: true, tip: 'Conversational tone — hurts Academic register.' },
  { text: ' than old people.' },
];

const IMPROVED_SEGMENTS = [
  { text: 'The line graph ' },
  {
    text: 'illustrates',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'Precise reporting verb instead of “shows”.',
  },
  { text: ' a ' },
  {
    text: 'significant upward trend',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'Academic collocation for “increased”.',
  },
  { text: ' in cinema attendance over the two-decade period. Starting from a ' },
  {
    text: 'nadir',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'C1 noun for the lowest point — replaces “It was low”.',
  },
  { text: ' in 1990, figures ' },
  {
    text: 'surged dramatically',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'Strong verb + adverb for “went up high”.',
  },
  { text: ' by 2010. ' },
  {
    text: 'Furthermore',
    enhancement: true,
    criterion: 'Coherence & Cohesion',
    tip: 'Clear discourse marker instead of “Also”.',
  },
  { text: ', there is a ' },
  {
    text: 'clear correlation',
    enhancement: true,
    criterion: 'Task Achievement',
    tip: 'States the age–preference relationship explicitly.',
  },
  { text: ' between age and preference, with younger ' },
  {
    text: 'demographics',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'Academic noun for “young people”.',
  },
  { text: ' showing higher ' },
  {
    text: 'engagement',
    enhancement: true,
    criterion: 'Lexical Resource',
    tip: 'Precise alternative to “like movies”.',
  },
  { text: '.' },
];

function CriterionTip({ tip, criterion, variant = 'enhance' }) {
  if (!tip) return null;
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[14rem] -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
        variant === 'error'
          ? 'bg-red-900 text-red-50 dark:bg-red-950 dark:text-red-100'
          : 'bg-slate-900 text-white dark:bg-indigo-950 dark:text-indigo-50'
      }`}
    >
      {criterion ? (
        <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider opacity-80">
          {criterion}
        </span>
      ) : null}
      {tip}
    </span>
  );
}

function HighlightSpan({ seg, variant }) {
  const isMarked = variant === 'error' ? seg.error : seg.enhancement;
  if (!isMarked) return <span>{seg.text}</span>;

  const className =
    variant === 'error'
      ? 'group relative inline cursor-help rounded-sm bg-red-100 px-0.5 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      : 'group relative inline cursor-help rounded-sm bg-indigo-100 px-0.5 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100';

  return (
    <span className={className} tabIndex={0}>
      {seg.text}
      <CriterionTip tip={seg.tip} criterion={seg.criterion} variant={variant} />
    </span>
  );
}

const TransformationSlider = ({ darkMode: _darkMode, onCtaClick }) => {
  const [copied, setCopied] = useState(false);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef(null);

  const copyToClipboard = useCallback(() => {
    const text = IMPROVED_SEGMENTS.map((s) => s.text).join('');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  const updateSplitFromClientX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(92, Math.max(8, next)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const x = e.touches ? e.touches[0]?.clientX : e.clientX;
      if (typeof x === 'number') updateSplitFromClientX(x);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, updateSplitFromClientX]);

  const originalBand = 5.5;
  const improvedBand = 8.5;
  const improvement = (improvedBand - originalBand).toFixed(1);
  const improvedPercent = Math.round((improvedBand / 9) * 100);

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <span className="tagline-pill mb-2 block w-fit mx-auto">Transformation</span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          IELTS Task 1. <span className="text-indigo-600 dark:text-indigo-400">Academic Elite</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1.5 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Drag the divider to compare Band {originalBand} → {improvedBand}. Hover highlighted words to see why the score rose.
        </p>
      </div>

      <motion.div
        className="rounded-3xl bg-white dark:bg-slate-800/30 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all duration-200"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700/50 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Before · Band {originalBand}
            </span>
            <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              After · Band {improvedBand}
            </span>
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-600/50 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400"
            aria-label="Copy enhanced text"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} /> Copy Band 8.5
              </>
            )}
          </button>
        </div>

        {/* Interactive before / after slider */}
        <div
          ref={trackRef}
          className="relative min-h-[14rem] select-none touch-none sm:min-h-[16rem]"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            setDragging(true);
            updateSplitFromClientX(e.clientX);
          }}
        >
          {/* After (full width, underneath) */}
          <div className="absolute inset-0 bg-white p-5 sm:p-6 dark:bg-slate-800/40">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              AI Enhanced · hover words for criteria
            </p>
            <div className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
              &ldquo;
              {IMPROVED_SEGMENTS.map((seg, i) => (
                <HighlightSpan key={`after-${i}`} seg={seg} variant="enhance" />
              ))}
              &rdquo;
            </div>
          </div>

          {/* Before (clipped from the right) */}
          <div
            className="absolute inset-0 bg-[#f8fafc] p-5 sm:p-6 dark:bg-slate-900/50"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-red-500">
              Original · Band {originalBand}
            </p>
            <div className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
              &ldquo;
              {ORIGINAL_SEGMENTS.map((seg, i) => (
                <HighlightSpan key={`before-${i}`} seg={seg} variant="error" />
              ))}
              &rdquo;
            </div>
          </div>

          {/* Divider handle */}
          <div
            className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-slate-900 shadow-md dark:bg-white"
            style={{ left: `${split}%` }}
            aria-hidden
          >
            <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-lg dark:border-white dark:bg-slate-900">
              <span className="text-[10px] font-black tracking-tighter text-slate-900 dark:text-white">
                ⇄
              </span>
            </div>
          </div>

          <label className="sr-only" htmlFor="transformation-split">
            Before and after comparison position
          </label>
          <input
            id="transformation-split"
            type="range"
            min={8}
            max={92}
            value={Math.round(split)}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            aria-valuemin={8}
            aria-valuemax={92}
            aria-valuenow={Math.round(split)}
            aria-label="Drag to compare original and enhanced text"
          />
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-100 bg-slate-50/50 px-5 py-5 dark:border-slate-700/50 dark:bg-slate-900/30 sm:flex-row sm:px-6 lg:px-8 sm:py-6">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                  <motion.path
                    className="text-indigo-600 dark:text-indigo-400"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: improvedPercent / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-indigo-600 dark:text-indigo-400 sm:text-xl">
                  {improvedBand}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Estimated Score
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Band {improvedBand} · {improvedPercent}%
                </p>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Comparison
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                Estimated Improvement:{' '}
                <span className="text-red-500">+{improvement} Band Score</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {originalBand} → {improvedBand}
              </p>
            </div>
          </div>

          {onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              className="btn-stratum shrink-0 rounded-xl px-6 py-3 hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] sm:px-8"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">START WITH STRATUM</span>
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default TransformationSlider;
