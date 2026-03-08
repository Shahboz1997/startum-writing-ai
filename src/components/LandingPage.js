'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import TransformationSlider from '@/components/TransformationSlider';
import Task2ComparisonLab from '@/components/Task2ComparisonLab';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CursorArrowRaysIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  StarIcon,
  SparklesIcon,
  PencilSquareIcon,
  ChartBarSquareIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useBilling } from '@/components/BillingContext';

const appleEase = [0.16, 1, 0.3, 1];
const fadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { ease: appleEase, duration: 0.8 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  viewport: { once: true, margin: '-32px' },
};
const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { ease: appleEase, duration: 0.7 },
};

/* Section header: Cathalon — font-black, tracking-tighter, uppercase */
function SectionHeading({ tagline, children }) {
  return (
    <div>
      {tagline && (
        <span className="tagline-pill mb-2 block w-fit">{tagline}</span>
      )}
      <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
        {children}
      </h2>
    </div>
  );
}

const VOCAB_BOOSTER = [
  { word: 'increase', synonyms: ['surge', 'soar', 'climb', 'rise'] },
  { word: 'decrease', synonyms: ['plummet', 'decline', 'drop', 'dip'] },
  { word: 'show', synonyms: ['demonstrate', 'illustrate', 'reveal'] },
  { word: 'go up', synonyms: ['rise', 'grow', 'escalate'] },
  { word: 'stay the same', synonyms: ['remain stable', 'plateau', 'level off'] },
  { word: 'big', synonyms: ['substantial', 'significant', 'considerable'] },
  { word: 'small', synonyms: ['marginal', 'modest', 'slight'] },
  { word: 'a lot', synonyms: ['substantially', 'significantly', 'considerably'] },
  { word: 'about', synonyms: ['approximately', 'roughly', 'around'] },
  { word: 'get', synonyms: ['obtain', 'acquire', 'attain'] },
];

const SUCCESS_PATH_STEPS = [
  { step: 1, title: 'Generate Topic', desc: 'Pick a prompt from our lab or create one with a keyword. Task 1 & Task 2 ready.', Icon: SparklesIcon },
  { step: 2, title: 'Write Essay', desc: 'Compose your answer in the editor. Use the timer and word count like the real test.', Icon: PencilSquareIcon },
  { step: 3, title: 'Get Instant Band Score', desc: 'AI Examiner grades you on official criteria and gives a detailed breakdown.', Icon: ChartBarSquareIcon },
  { step: 4, title: 'Fix Mistakes', desc: 'Click highlights to see corrections, vocabulary upgrades, and a full suggested rewrite.', Icon: WrenchScrewdriverIcon },
];

const VOCAB_UPGRADES = [
  { basic: 'increase', advanced: 'surge / skyrocket', category: 'Task 1' },
  { basic: 'think', advanced: 'assert / maintain', category: 'Task 2' },
  { basic: 'big change', advanced: 'dramatic shift', category: 'Task 1' },
  { basic: 'good', advanced: 'exemplary / beneficial', category: 'General' },
  { basic: 'problem', advanced: 'setback / predicament', category: 'Task 2' },
  { basic: 'importent', advanced: 'crucial', category: 'task2' }
];

const BAND_6_SAMPLE = `The graph show how many people went to the cinema from 1990 to 2010. We can see that the number go up a lot in the first years. In 1995 it was about 50 million but then it get bigger and in 2010 it was more than 80 million. So the trend is that cinema get more popular over the time.`;

const BAND_85_SAMPLE = `The graph illustrates cinema attendance between 1990 and 2010. Attendance rose substantially in the first decade, from approximately 35 million to around 50 million by 1995, before climbing to over 80 million by 2010. Overall, cinema grew significantly in popularity over the period.`;

function BeforeAfterComparison() {
  const [sliderPos, setSliderPos] = useState(50);
  return (
    <motion.div
      className="mt-4 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
    >
      <div className="grid md:grid-cols-2 gap-0 min-h-[220px]">
        <div
          className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 transition-opacity duration-200"
          style={{ opacity: 0.5 + (sliderPos / 100) * 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
              Band 6.0
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Before</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
            {BAND_6_SAMPLE}
          </p>
        </div>
        <div
          className="p-5 md:p-6 transition-opacity duration-200"
          style={{ opacity: 0.5 + ((100 - sliderPos) / 100) * 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-red-100 dark:bg-red-900/20 text-red-500">
              Band 8.5
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">After</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
            {BAND_85_SAMPLE}
          </p>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/5 bg-slate-50/80 dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-indigo-600 dark:text-indigo-400">Compare:</span> drag to reveal
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-slate-200 dark:bg-slate-700 accent-indigo-600"
          aria-label="Reveal Before or After comparison"
        />
      </div>
    </motion.div>
  );
}

export default function LandingPage({ onLoginClick, onFullAnalysisClick }) {
  const { plans, openPricing } = useBilling();
  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);
  const darkMode = themeMounted && resolvedTheme === 'dark';

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300 pt-0">
      {/* Hero — centered, spotlight gradient, noise overlay */}
      <section className="relative flex flex-col justify-center bg-[#F9FAFB] dark:bg-[#050505] px-4 pt-24 pb-16 border-b border-white/5 overflow-hidden hero-noise">
        {/* Subtle radial spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.12)_0%,transparent_50%)] pointer-events-none" aria-hidden />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="tagline-pill mb-2 inline-block text-slate-500 dark:text-slate-400 font-medium tracking-wide"
          >
            AI-Powered Writing Assessment
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-3"
          >
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
              Master IELTS Writing. Engineered by AI.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium tracking-wide max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Examiner-grade feedback in seconds. Aligned with official Band Descriptors. Stop guessing—start improving.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-8"
          >
            <button
              type="button"
              onClick={onFullAnalysisClick}
              className="btn-stratum px-7 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">START WITH STRATUM</span>
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              className="btn-squircle-secondary px-7 py-3.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10"
            >
              Get Free Credits
            </button>
          </motion.div>

          {/* Dashboard preview — bento widget */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto w-full max-w-2xl rounded-3xl bg-white/80 dark:bg-white/5 border border-white/5 backdrop-blur-md shadow-2xl shadow-black/5 dark:shadow-black/20 p-4 sm:p-5 mt-8"
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Task 2 — Preview</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">CEFR</span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-600 dark:text-indigo-400">B2–C1</span>
                <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-xs font-semibold text-red-500">Band 7.5</span>
              </div>
            </div>
            <div className="h-20 sm:h-24 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">Essay preview</p>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-1.5 w-1/4 rounded-full bg-indigo-400/40" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest"
          >
            Trusted by Students Worldwide
          </motion.p>
        </div>
      </section>

      {/* How It Works — bento cards */}
      <section id="how-it-works" className="-mt-10 py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">How it works</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              The Future of IELTS Preparation
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: 1, icon: DocumentTextIcon, title: 'Choose Your Task', desc: 'Generate a fresh IELTS prompt or paste your existing essay draft. Academic and General Training modules supported.' },
              { step: 2, icon: MagnifyingGlassIcon, title: 'AI-Powered Analysis', desc: 'Our AI examiner analyses 50+ linguistic parameters, identifying grammatical nuance and lexical gaps against official criteria.' },
              { step: 3, icon: ChartBarIcon, title: 'Deep Dive Results', desc: 'Access interactive colour-coded highlights, C1/C2 vocabulary upgrades, and download your formal PDF report.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  {...fadeInUp}
                  className="p-6 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-base font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-2">Step {item.step}: {item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison — bento card */}
      <section className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Comparison</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Why Generic AI Is Not Enough for IELTS
            </h2>
          </motion.div>
          <motion.div
            {...fadeInUp}
            className="overflow-x-auto rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20"
          >
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 font-semibold text-slate-900 dark:text-white text-sm"></th>
                  <th className="text-left p-4 font-medium tracking-wide text-slate-500 dark:text-slate-400 text-sm">Generic AI (e.g. ChatGPT)</th>
                  <th className="text-left p-4 font-semibold text-indigo-600 dark:text-indigo-400 text-sm">STRATUM.ai</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Feedback quality', generic: 'Vague feedback', booster: 'IDP/BC Certified Logic' },
                  { feature: 'Scoring', generic: 'Inconsistent scoring', booster: 'Real-time Band Descriptors' },
                  { feature: 'Criteria', generic: 'Lacks official criteria', booster: 'Deep Error Mapping' },
                  { feature: 'Tone', generic: 'Informal tone suggestions', booster: 'Academic Register Engine' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{row.feature}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                      <span className="inline-flex items-center gap-1.5">
                        <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                        {row.generic}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        {row.booster}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>
      {/* IELTS Labs flow: Transformation + Task 2 */}
      <section className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <motion.div {...fadeInUp}>
          <TransformationSlider darkMode={darkMode} onCtaClick={onFullAnalysisClick} />
        </motion.div>
        <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeInUp} className="text-center mb-4">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Vocabulary</span>
            <h3 className="text-lg sm:text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Stop using basic words. Start using Band 9 vocabulary.
            </h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VOCAB_UPGRADES.map((item, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                className="p-4 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm line-through text-slate-400 font-medium">{item.basic}</span>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    → {item.advanced}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Task 2 Comparison Lab */}
      <section className="py-8 sm:py-10 bg-white/50 dark:bg-white/5 border-b border-white/5">
        <Task2ComparisonLab darkMode={darkMode} />
      </section>

      {/* Success Stories — bento cards */}
      <section className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Testimonials</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Trusted by Students Worldwide
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { quote: 'Stratum\'s feedback is remarkably accurate. It identified errors my tutor had missed. I went from 6.0 to 7.5 in three weeks.', author: 'Ahmed', location: 'Saudi Arabia', band: '6.0 → 7.5' },
              { quote: 'The vocabulary upgrades are a game-changer. It taught me how to achieve a native-level academic register.', author: 'Lin', location: 'China', band: '6.5 → 8.0' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                className="p-6 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-xs font-semibold text-red-500 ml-1">{item.band}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.author}, {item.location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — bento cards */}
      <section id="pricing" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Plans</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-1">
              Plans &amp; Pricing
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your preparation. Upgrade at any time.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                {...fadeInUp}
                className={`relative p-6 rounded-3xl border border-white/5 backdrop-blur-md transition-all duration-300 shadow-2xl shadow-black/5 dark:shadow-black/20 ${
                  plan.popular
                    ? 'bg-indigo-50/80 dark:bg-indigo-900/20'
                    : 'bg-white/80 dark:bg-white/5 hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-indigo-600 text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-center pt-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{plan.price}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{plan.desc}</p>
                  <button
                    type="button"
                    onClick={() => { openPricing(); onFullAnalysisClick?.(); }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      plan.popular
                        ? 'btn-stratum hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]'
                        : 'btn-squircle-secondary text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {plan.popular ? (
                      <>
                        <div className="shimmer-layer animate-shimmer" aria-hidden />
                        <span className="btn-stratum-text">GET STARTED · STRATUM</span>
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-white/50 dark:bg-white/5 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Get started</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-2">
              Ready to Reach Band 7.5+?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6 leading-relaxed">
              Move beyond ineffective practice. Your first five checks are free.
            </p>
            <button
              type="button"
              onClick={onFullAnalysisClick}
              className="btn-stratum px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">GET CREDITS · STRATUM</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#F9FAFB] dark:bg-[#050505]">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
              <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Refund Policy
              </Link>
            </div>
            <p className="text-sm font-medium tracking-wide text-slate-900 dark:text-white">
              © 2026 STRATUM LLC. Registered in Delaware, USA.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <a href="mailto:support@stratum.ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                support@stratum.ai
              </a>
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-2 text-xs font-medium tracking-tight text-slate-400 dark:text-slate-500">
              <span>We accept</span>
              <span className="inline-flex items-center gap-3">
                <span>Visa</span>
                <span>Mastercard</span>
                <span>Apple Pay</span>
              </span>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
