'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

const TransformationSlider = ({ darkMode, onCtaClick }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    const text = improvedSegments.map((s) => s.text).join('');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  // Segment data: original with "error" spans, improved with "enhancement" spans
  const originalSegments = [
    { text: 'The graph shows that the number of people who ' },
    { text: 'go to the cinema', error: true },
    { text: ' increased. ' },
    { text: 'It was low', error: true },
    { text: ' in 1990 and then it ' },
    { text: 'went up high', error: true },
    { text: ' in 2010. Also, more young people ' },
    { text: 'like movies', error: true },
    { text: ' than old people.' },
  ];

  const improvedSegments = [
    { text: 'The line graph ' },
    { text: 'illustrates', enhancement: true },
    { text: ' a ' },
    { text: 'significant upward trend', enhancement: true },
    { text: ' in cinema attendance over the two-decade period. Starting from a ' },
    { text: 'nadir', enhancement: true },
    { text: ' in 1990, figures ' },
    { text: 'surged dramatically', enhancement: true },
    { text: ' by 2010. ' },
    { text: 'Furthermore', enhancement: true },
    { text: ', there is a ' },
    { text: 'clear correlation', enhancement: true },
    { text: ' between age and preference, with younger ' },
    { text: 'demographics', enhancement: true },
    { text: ' showing higher ' },
    { text: 'engagement', enhancement: true },
    { text: '.' },
  ];

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
          See how our AI transforms basic English into Band 8.5+ academic writing
        </p>
      </div>

      <motion.div
        className="rounded-3xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all duration-200"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {/* Split-screen: Input (Original) | Output (AI Enhanced) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-700/50">
          {/* Left — Original (Input) */}
          <div className="p-5 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Input · Original
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-[10px] font-semibold text-red-500">
                Original Errors
              </span>
            </div>
            <div className="text-base sm:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              &ldquo;
              {originalSegments.map((seg, i) =>
                seg.error ? (
                  <span
                    key={i}
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-sm px-0.5"
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
              &rdquo;
            </div>
          </div>

          {/* Right — AI Enhanced (Output) + Copy + Metadata */}
          <div className="p-5 sm:p-6 lg:p-8 bg-white dark:bg-slate-800/40 relative">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Output · AI Enhanced
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  AI Improvements
                </span>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 text-xs font-medium"
                aria-label="Copy enhanced text"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            {/* Linguistic metadata pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                CEFR: C1
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                Academic Tone: High
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                Cohesion: 95%
              </span>
            </div>
            <div className="text-base sm:text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              &ldquo;
              {improvedSegments.map((seg, i) =>
                seg.enhancement ? (
                  <span
                    key={i}
                    className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 rounded-sm px-0.5"
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
              &rdquo;
            </div>
          </div>
        </div>

        {/* Score area: circular gauge + comparison label */}
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Circular progress for Improved score */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
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
                <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                  {improvedBand}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Estimated Score
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  Band {improvedBand} · {improvedPercent}%
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Comparison
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                Estimated Improvement: <span className="text-red-500">+{improvement} Band Score</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {originalBand} → {improvedBand}
              </p>
            </div>
          </div>

          {onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              className="btn-stratum px-6 sm:px-8 py-3 rounded-xl shrink-0 hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
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
