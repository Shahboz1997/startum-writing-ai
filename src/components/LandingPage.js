'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import TransformationSlider from '@/components/TransformationSlider';
import Task2ComparisonLab from '@/components/Task2ComparisonLab';
import {
  FileText,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
  PenTool,
  Wrench,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
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
  { step: 1, title: 'Generate Topic', desc: 'Pick a prompt from our lab or create one with a keyword. Task 1 & Task 2 ready.', Icon: Sparkles },
  { step: 2, title: 'Write Essay', desc: 'Compose your answer in the editor. Use the timer and word count like the real test.', Icon: PenTool },
  { step: 3, title: 'Get Instant Band Score', desc: 'AI Examiner grades you on official criteria and gives a detailed breakdown.', Icon: BarChart3 },
  { step: 4, title: 'Fix Mistakes', desc: 'Click highlights to see corrections, vocabulary upgrades, and a full suggested rewrite.', Icon: Wrench },
];

const VOCAB_UPGRADES = [
  { basic: 'increase', advanced: 'surge / skyrocket', category: 'Task 1' },
  { basic: 'think', advanced: 'assert / maintain', category: 'Task 2' },
  { basic: 'big change', advanced: 'dramatic shift', category: 'Task 1' },
  { basic: 'good', advanced: 'exemplary / beneficial', category: 'General' },
  { basic: 'problem', advanced: 'setback / predicament', category: 'Task 2' },
  { basic: 'importent', advanced: 'crucial', category: 'task2' }
];

const FAQ_ITEMS = [
  {
    q: 'How accurate is Stratum AI for IELTS scoring?',
    a: 'Our neural network is trained on thousands of official IELTS samples. Stratum AI achieves 98% correlation with human examiner scoring across all four criteria.',
  },
  {
    q: 'Does it support both Academic and General Training?',
    a: 'Yes. Stratum Intelligence is specifically calibrated to handle the data descriptions of Academic Task 1 and the formal letter structures of General Training.',
  },
  {
    q: 'Will using Stratum AI help me reach Band 8.0?',
    a: 'Absolutely. By identifying your recurring grammar strata and providing high-level lexical upgrades, Stratum focuses on the specific gaps preventing you from hitting Band 7.5+.',
  },
  {
    q: 'Is my data secure and private?',
    a: 'We prioritize your privacy. Your essays are processed via encrypted channels and are never shared with third parties or used for public model training.',
  },
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
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
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
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-4"
          >
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
              Master IELTS with Stratum Intelligence
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium tracking-wide max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Elevate your IELTS score with precision AI-driven evaluation for Writing Task 1 and Task 2. Get instant Band 9.0-style feedback and stratum-level analytics to master the exam.
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
            <div className="h-20 sm:h-24 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center px-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide text-center">Paste your essay or generate a prompt to see instant Band Score and AI-evaluation for your Writing Task.</p>
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

      {/* Section 1: Precision AI Analysis — Features & Value */}
      <section id="how-it-works" aria-labelledby="section-precision-ai" className="-mt-10 py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">AI-Evaluation</span>
            <h2 id="section-precision-ai" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Precision AI Analysis for Writing Task 1 &amp; 2
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              STRATUM.ai delivers exam-grade AI-evaluation for both Academic and General Training. Our engine scores your Writing Task 1 and Task 2 against official band descriptors so you can improve stratum by stratum.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: 'Grammar & Cohesion Audit', desc: 'Our AI runs a full grammar and cohesion audit on your essay, flagging errors and suggesting linking words so your Writing Task meets Band 7+ standards.' },
              { icon: Search, title: 'Lexical Resource Upgrade', desc: 'Get precise lexical resource feedback with Band 9-level synonyms and collocations. Replace weak vocabulary and boost your Band Score with every submission.' },
              { icon: BarChart3, title: 'Real-Time Scoring', desc: 'Receive real-time scoring across Task Achievement, Coherence, Vocabulary, and Grammar. See your Band Score and criterion breakdown instantly after each Writing Task.' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  {...fadeInUp}
                  className="group p-6 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:scale-110 [&_svg]:[filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Instant Band 9.0 Feedback & Corrections */}
      <section aria-labelledby="section-band-feedback" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Band Score</span>
            <h2 id="section-band-feedback" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Instant Band 9.0 Feedback &amp; Corrections
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Get instant Band 9.0-style feedback and in-line corrections for every Writing Task. STRATUM.ai compares against generic AI so you see why precision AI-evaluation and real-time Band Score matter for IELTS.
            </p>
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
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={1.5} />
                        {row.generic}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={1.5} />
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
      {/* Section 3: Stratum-Level Analytics for Your Progress */}
      <section aria-labelledby="section-stratum-analytics" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <motion.div {...fadeInUp}>
          <TransformationSlider darkMode={darkMode} onCtaClick={onFullAnalysisClick} />
        </motion.div>
        <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Progress</span>
            <h2 id="section-stratum-analytics" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-3">
              Stratum-Level Analytics for Your Progress
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Track your progress with stratum-level analytics and Band 9 vocabulary upgrades. See before-and-after comparisons and real-time scoring so every Writing Task moves you closer to your target Band Score.
            </p>
          </motion.div>
          <motion.div {...fadeInUp} className="text-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold tracking-wide text-slate-900 dark:text-white">
              Lexical Resource Upgrade
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
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Students use STRATUM.ai for AI-evaluation and Band Score feedback on their Writing Task 1 and Task 2. Read how precision feedback and stratum-level analytics helped them reach their target band.
            </p>
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
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={1.5} />
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
              Choose the plan that fits your IELTS preparation. Get access to AI-evaluation, Band Score feedback, and stratum-level analytics. Upgrade or change your plan at any time.
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
                  <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{plan.price}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium tracking-wide leading-relaxed">{plan.desc}</p>
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
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6 leading-relaxed max-w-xl mx-auto">
              Move beyond ineffective practice. Get precision AI-evaluation and Band Score feedback on your Writing Task 1 and Task 2. Your first five checks are free with STRATUM.ai.
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

      {/* FAQ — Glassmorphism accordion */}
      <section id="faq" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">FAQ</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
              Everything you need to know about Stratum AI scoring, Academic and General Training support, and your data privacy.
            </p>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <motion.div
                  key={index}
                  {...fadeInUp}
                  className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 dark:hover:bg-white/5"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="font-bold uppercase tracking-widest text-xs text-slate-900 dark:text-white pr-4">
                      {item.q}
                    </span>
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 transition-transform duration-200">
                      <AnimatePresence mode="wait">
                        {isOpen ? (
                          <motion.span key="minus" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Minus className="w-4 h-4" strokeWidth={2} />
                          </motion.span>
                        ) : (
                          <motion.span key="plus" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                            <Plus className="w-4 h-4" strokeWidth={2} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
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
