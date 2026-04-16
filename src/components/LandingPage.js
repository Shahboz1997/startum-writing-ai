'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
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
  Download,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Crown,
  Filter,
  Type,
  LayoutGrid,
  RefreshCw,
  AlignLeft,
  Shield,
  ShieldCheck,
  Target,
  Zap,
  Volume2,
  Headphones,
  Share2,
  X,
  CalendarDays,
  BellRing,
  LineChart,
  BookOpen,
} from 'lucide-react';
import { TASK1_TIPS, TASK2_TIPS } from '@/lib/ieltsGuidelines';
import { useBilling } from '@/components/BillingContext';
import NeuralSyncShowcase from '@/components/NeuralSyncShowcase';

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
  { basic: 'importent', advanced: 'crucial', category: 'Task 2' },
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
  {
    q: 'Does STRATUM include a study plan and practice reminders?',
    a: 'Yes. Your Study plan page turns saved checks into a Writing profile: criterion averages, recurring error patterns, sub-topic trends, and curated links for weak areas. Optional email reminders in Settings let you pick local time, weekdays, and timezone so consistency becomes effortless.',
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
  const { status } = useSession();
  const [themeMounted, setThemeMounted] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [shareInfoOpen, setShareInfoOpen] = useState(false);
  useEffect(() => setThemeMounted(true), []);
  const darkMode = themeMounted && resolvedTheme === 'dark';

  const shareLanding = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.origin;
    const title = 'STRATUM.ai — Premium IELTS Intelligence';
    const text = 'Try STRATUM.ai for IELTS Writing Task 1 & Task 2.';
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // user canceled or share failed
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const cycleContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
    viewport: { once: true, margin: '-48px' },
  };
  const cycleItem = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { ease: appleEase, duration: 0.7 },
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300 pt-0">
      {/* Hero — centered, spotlight gradient, noise overlay */}
      <section className="relative flex flex-col justify-center bg-[#F9FAFB] dark:bg-[#050505] px-4 pt-10 pb-16 border-b border-white/5 overflow-hidden hero-noise">
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto"
          >
            {[
              { label: 'Writing profile analytics', Icon: LineChart },
              { label: 'Study plan & focus', Icon: Target },
              { label: 'Email practice reminders', Icon: BellRing },
              { label: 'Weak-area resources', Icon: BookOpen },
            ].map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={2} />
                {label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-col items-center gap-3 mb-4"
          >
            <button
              type="button"
              onClick={async () => {
                if (status !== 'authenticated') {
                  setShareInfoOpen((v) => !v);
                  return;
                }
                setShareInfoOpen(false);
                await shareLanding();
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold tracking-wide hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
              title={status === 'authenticated' ? 'Share STRATUM.ai' : 'Info'}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <AnimatePresence>
              {shareInfoOpen && status !== 'authenticated' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="w-full max-w-xl px-4"
                >
                  <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/70 dark:bg-indigo-950/30 px-4 py-3 text-center text-xs sm:text-sm font-medium text-indigo-900/90 dark:text-indigo-200">
                    Sharing is available after you create an account and sign in.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* Workflow — four steps (prompt → feedback loop) */}
      <section aria-labelledby="section-workflow" className="py-10 sm:py-14 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Workflow
            </span>
            <h2 id="section-workflow" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              From prompt to band breakthrough
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              A clear loop: generate, write, score, fix — then let your saved checks build a data-backed study plan.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {SUCCESS_PATH_STEPS.map(({ step, title, desc, Icon }) => (
              <motion.div
                key={step}
                {...fadeInUp}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/20"
              >
                <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/90 dark:text-indigo-400/90">
                  {String(step).padStart(2, '0')}
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/35 flex items-center justify-center mb-4 border border-indigo-200/30 dark:border-indigo-700/25">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white mb-2 pr-10">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: Precision AI Analysis — Features & Value */}
      <section id="how-it-works" aria-labelledby="section-precision-ai" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
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
              {
                icon: Volume2,
                title: 'MP3 Audio Models',
                desc: (
                  <>
                    Download AI-generated audio models of Band 9.0-level responses for advanced shadowing practice.
                    <span className="block mt-3">
                      Master the Sound of Band 9.0. Download AI-generated audio models and perfect your pronunciation with the Stratum Shadowing technique.
                    </span>
                  </>
                ),
              },
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

      {/* Neural Sync — THE SOUND OF PERFECTION */}
      <NeuralSyncShowcase onCtaClick={onFullAnalysisClick} />

      {/* Section 3: Stratum-Level Analytics for Your Progress */}
      <section aria-labelledby="section-stratum-analytics" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <motion.div {...fadeInUp}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-1">
              <div className="rounded-[1.8rem] bg-white/80 dark:bg-white/5">
                <TransformationSlider darkMode={darkMode} onCtaClick={onFullAnalysisClick} />
              </div>
            </div>
          </div>
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

      {/* Study plan, analytics & reminders — latest dashboard features */}
      <section
        id="study-plan"
        aria-labelledby="section-study-plan"
        className="py-12 sm:py-16 bg-gradient-to-b from-[#F0F4FF]/60 via-[#F9FAFB] to-[#F9FAFB] dark:from-indigo-950/20 dark:via-[#050505] dark:to-[#050505] border-b border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10 sm:mb-12">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Preparation
            </span>
            <h2
              id="section-study-plan"
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white"
            >
              Study plan, analytics &amp; reminders
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              STRATUM does not stop at one-off scores. Your dashboard aggregates every saved check into trends, focus areas, and habits — so preparation stays measurable between exam day and today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                Icon: LineChart,
                title: 'Writing profile & charts',
                blurb:
                  'Criterion averages, flagged issue types, and sub-topic patterns — built from your archive. See where you gain points and where errors repeat.',
                accent: 'from-indigo-500/15 to-transparent',
              },
              {
                Icon: BookOpen,
                title: 'Curated weak-area links',
                blurb:
                  'The Study plan suggests external materials matched to your profile — turn analytics into targeted practice instead of random essays.',
                accent: 'from-teal-500/12 to-transparent',
              },
              {
                Icon: CalendarDays,
                title: 'Timezone-aware email nudges',
                blurb:
                  'Enable practice reminders in Settings: pick weekdays, local send time, and your timezone. Gentle consistency beats cramming.',
                accent: 'from-violet-500/15 to-transparent',
              },
            ].map(({ Icon, title, blurb, accent }) => (
              <motion.div
                key={title}
                {...fadeInUp}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/85 dark:bg-white/5 backdrop-blur-md p-6 sm:p-7 shadow-2xl shadow-black/5 dark:shadow-black/25 transition-all duration-300 hover:border-indigo-300/30 dark:hover:border-indigo-500/20"
              >
                <div
                  className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br ${accent} blur-2xl opacity-90`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 ring-1 ring-indigo-200/50 dark:ring-indigo-600/30 transition-transform duration-300 group-hover:scale-[1.05]">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{blurb}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-indigo-300/40 dark:border-indigo-500/25 bg-indigo-50/50 dark:bg-indigo-950/20 px-6 py-5"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 shadow-sm ring-1 ring-indigo-200/60 dark:ring-white/10">
                <BellRing className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                  After you sign in
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  Open <span className="text-slate-900 dark:text-white">Study plan</span> for analytics and{' '}
                  <span className="text-slate-900 dark:text-white">Settings</span> for email reminders — same account, one preparation stack.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLoginClick}
              className="shrink-0 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-white/90 dark:bg-slate-900/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-200 shadow-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              Sign in to unlock
            </button>
          </motion.div>
        </div>
      </section>

      {/* Task 2 Comparison Lab — Static Premium Demo (Cathalon.ai style) */}
      <section className="py-8 sm:py-10 bg-white/50 dark:bg-white/5 border-b border-white/5">
        <Task2ComparisonLab darkMode={darkMode} />
      </section>

      {/* Intelligence Ecosystem — The Stratum Cycle */}
      <section aria-labelledby="section-stratum-cycle" className="py-14 sm:py-20 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10 sm:mb-12">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Intelligence Ecosystem
            </span>
            <h2 id="section-stratum-cycle" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              BEYOND EVALUATION. COMPLETE MASTERY.
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              The Stratum Cycle connects prompt generation, examiner-grade evaluation, and audio shadowing into one continuous improvement loop — with writing-profile analytics and optional email reminders so progress does not fade between sessions.
            </p>
          </motion.div>

          <motion.div {...cycleContainer} className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                step: '01',
                title: 'Neural Generation',
                Icon: Sparkles,
                text: 'Generate infinite Task 1 & 2 prompts calibrated to 2026 IELTS standards.',
              },
              {
                step: '02',
                title: 'Deep Analysis',
                Icon: ShieldCheck,
                text: 'Receive instant Band Score evaluation with precise grammar and lexical strata mapping.',
              },
              {
                step: '03',
                title: 'Auditory Mastery',
                Icon: Headphones,
                text: 'Download AI-generated MP3 models to master the rhythm and pronunciation of Band 9.0 responses.',
              },
            ].map(({ step, title, Icon, text }) => (
              <motion.div
                key={step}
                {...cycleItem}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md shadow-2xl shadow-black/5 dark:shadow-black/20 p-6 sm:p-7"
              >
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none" aria-hidden />
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-200/40 dark:border-indigo-700/30">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Step {step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-wide text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeInUp} className="mt-10 sm:mt-12 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSampleOpen(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-800 hover:shadow-[0_0_25px_rgba(79,70,229,0.22)] active:scale-[0.98]"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/10 group-hover:border-indigo-300/40 transition-colors">
                <Download className="w-4 h-4 text-indigo-300" />
              </span>
              Download Sample Strata
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide text-center max-w-xl">
              Preview the STRATUM report format + audio model interface before you generate your first check.
            </p>
          </motion.div>
        </div>

        <AnimatePresence>
          {isSampleOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSampleOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ ease: appleEase, duration: 0.35 }}
                className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl shadow-black/40"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                      Sample STRATA Preview
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSampleOpen(false)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                    aria-label="Close sample preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Mock PDF */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Mock PDF</p>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/70">
                        STRATUM_REPORT.pdf
                      </span>
                    </div>
                    <div className="aspect-[4/5] rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25)_0%,transparent_55%)]" aria-hidden />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                        <div className="h-2 w-full rounded bg-white/10" />
                        <div className="h-2 w-11/12 rounded bg-white/10" />
                        <div className="h-2 w-10/12 rounded bg-white/10" />
                        <div className="mt-4 h-24 rounded-xl bg-white/5 border border-white/10" />
                        <div className="h-2 w-9/12 rounded bg-white/10" />
                        <div className="h-2 w-full rounded bg-white/10" />
                      </div>
                      <div className="absolute bottom-4 right-4 px-2 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
                        Page 1/3
                      </div>
                    </div>
                  </div>

                  {/* Mock MP3 */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Mock MP3</p>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/70">
                        STRATUM_MODEL.mp3
                      </span>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                          <Headphones className="w-5 h-5 text-indigo-300" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-white/90">Band 9.0 Model Voice</p>
                          <p className="text-[11px] text-white/60">Shadowing-ready pacing &amp; intonation</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 text-white hover:bg-indigo-500/25 transition-colors"
                          aria-label="Play sample"
                        >
                          <Volume2 className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl bg-slate-900/40 border border-white/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                            Audio strata bar
                          </span>
                          <span className="text-[10px] font-bold text-white/60">00:15 / 00:45</span>
                        </div>
                        <div className="flex items-end gap-[2px] h-8 rounded-2xl bg-white/5 border border-white/10 px-2 overflow-hidden">
                          {Array.from({ length: 34 }, (_, i) => {
                            const v = Math.abs(Math.sin(i * 0.92 + 0.7));
                            const h = 0.28 + v * 0.72;
                            const filled = i < 12;
                            return (
                              <span
                                key={i}
                                className={filled ? 'bg-indigo-400/90' : 'bg-white/20'}
                                style={{
                                  width: 3,
                                  height: `${Math.round(h * 100)}%`,
                                  borderRadius: 999,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          className="btn-stratum w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                          onClick={onFullAnalysisClick}
                        >
                          <div className="shimmer-layer animate-shimmer" aria-hidden />
                          <span className="btn-stratum-text">GET STARTED · STRATUM</span>
                        </button>
                        <button
                          type="button"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
                          onClick={() => setIsSampleOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* STRATUM METHODOLOGY — Expert IELTS Guidelines */}
      <section className="py-12 sm:py-16 bg-[#050505] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Expert Guidelines</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-white">
              STRATUM METHODOLOGY
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              The five principles we use to evaluate and improve your writing for Band 7+.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Task 1: Analytical Precision */}
            <motion.div
              {...fadeInUp}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-black/10"
            >
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-400 mb-6">
                Task 1: Analytical Precision
              </h3>
              <ul className="space-y-4">
                {TASK1_TIPS.map((tip, i) => {
                  const Icon = { Eye, Target, Shield, Filter, Zap }[tip.icon];
                  return (
                    <motion.li
                      key={tip.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-24px' }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-slate-300 dark:text-slate-300"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-indigo-400" strokeWidth={1.5} />}
                      <span className="text-sm font-medium">{tip.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
            {/* Task 2: Argumentative Mastery */}
            <motion.div
              {...fadeInUp}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-black/10"
            >
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-400 mb-6">
                Task 2: Argumentative Mastery
              </h3>
              <ul className="space-y-4">
                {TASK2_TIPS.map((tip, i) => {
                  const Icon = { Target, LayoutGrid, Crown, Shield, RefreshCw }[tip.icon];
                  return (
                    <motion.li
                      key={tip.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-24px' }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-slate-300 dark:text-slate-300"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-indigo-400" strokeWidth={1.5} />}
                      <span className="text-sm font-medium">{tip.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>
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
      {/* <section id="pricing" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
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
      </section> */}

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
            <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              Don&apos;t just practice. Evolve. Start your Stratum journey today.
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
