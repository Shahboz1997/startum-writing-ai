'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import TransformationSlider from '@/components/TransformationSlider';
import Task2RewriteDemo from '@/components/landing/Task2RewriteDemo';
import Task1DataErrorDemo from '@/components/landing/Task1DataErrorDemo';
import {
  BarChart3,
  CheckCircle,
  Sparkles,
  PenTool,
  Wrench,
  Plus,
  Minus,
  Eye,
  Crown,
  Filter,
  LayoutGrid,
  RefreshCw,
  Shield,
  Target,
  Zap,
  CalendarDays,
  BellRing,
  LineChart,
  BookOpen,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { TASK1_TIPS, TASK2_TIPS, LETTER_TIPS } from '@/lib/ieltsGuidelines';
import NeuralSyncShowcase from '@/components/NeuralSyncShowcase';
import LandingSampleReports from '@/components/landing/LandingSampleReports';
import LandingGuidesSection from '@/components/landing/LandingGuidesSection';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingLemonTestCheckout from '@/components/landing/LandingLemonTestCheckout';
import LandingHeroCheck from '@/components/landing/LandingHeroCheck';
import TelegramIcon from '@/components/icons/TelegramIcon';
import {
  TELEGRAM_BOT_URL,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/support';
import { trackTelegramClick } from '@/lib/analyticsEvents';
import { LANDING_FAQ_ITEMS as FAQ_ITEMS, LANDING_TELEGRAM, LANDING_WORKFLOW_STEPS } from '@/lib/landingSeoData';
import {
  landingFadeInUp,
  LandingCard,
  LandingIconCard,
  LandingInfoPanel,
  LandingMentionLine,
  LandingSection,
  LandingSectionHeader,
  LandingStepCard,
  LandingTextLink,
} from '@/components/landing/landingUi';

const WORKFLOW_ICONS = [Sparkles, PenTool, BarChart3, Wrench];

export default function LandingPage({ onLoginClick, onFullAnalysisClick, isLoggedIn = false }) {
  const router = useRouter();
  const { copy: abCopy } = useLandingAbVariant();
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300 pt-0">
      {/* Hero — interactive essay paste + free band preview */}
      <Suspense
        fallback={
          <section className="relative min-h-[28rem] bg-[#F9FAFB] dark:bg-[#050505] px-4 pt-10 pb-16" aria-hidden />
        }
      >
        <LandingHeroCheck
          onLoginClick={onLoginClick}
          isLoggedIn={isLoggedIn}
          onContinueToLab={() => {
            if (typeof onFullAnalysisClick === 'function') onFullAnalysisClick();
            else router.push('/?app=1');
          }}
        />
      </Suspense>

      {/* How it works */}
      <LandingSection id="how-it-works" ariaLabelledby="section-workflow">
        <LandingSectionHeader
          tagline="How it works"
          id="section-workflow"
          title="Paste → 4 criteria → fixes → rewrite"
          description="One compact loop from draft to examiner-style practice feedback."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {LANDING_WORKFLOW_STEPS.map((step, index) => (
            <LandingStepCard
              key={step.step}
              step={step.step}
              icon={WORKFLOW_ICONS[index]}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </LandingSection>

      <Task1DataErrorDemo />
      <TransformationSlider />
      <Task2RewriteDemo />
      <LandingSampleReports />

      <LandingGuidesSection />

      <LandingPricing isLoggedIn={isLoggedIn} onLoginClick={onLoginClick} />

      <Suspense fallback={null}>
        <LandingLemonTestCheckout isLoggedIn={isLoggedIn} onLoginClick={onLoginClick} />
      </Suspense>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-slate-200/50 dark:border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...landingFadeInUp}>
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Get started
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-2">
              Free demo → Sign in → Buy credits
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6 leading-relaxed max-w-xl mx-auto">
              {abCopy.offerLine}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('hero-check')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="btn-stratum px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
                data-ab-variant={abCopy.id}
              >
                <div className="shimmer-layer animate-shimmer" aria-hidden />
                <span className="btn-stratum-text">Start free demo</span>
              </button>
              <button
                type="button"
                onClick={() => onLoginClick?.()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Sign in
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress & study plan */}
      <LandingSection id="study-plan" ariaLabelledby="section-study-plan">
        <LandingSectionHeader
          tagline="Progress"
          id="section-study-plan"
          title="Analytics, study plan & reminders"
          description="Every saved check feeds your writing profile — criterion trends, weak-area links, and optional email nudges after sign-in."
        />
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-8">
          <LandingIconCard
            icon={LineChart}
            title="Writing profile & charts"
            description="Criterion averages, flagged issue types, and sub-topic patterns built from your archive."
          />
          <LandingIconCard
            icon={BookOpen}
            title="Curated weak-area links"
            description="Study plan suggests external materials matched to your profile — targeted practice, not random essays."
          />
          <LandingIconCard
            icon={CalendarDays}
            title="Timezone-aware reminders"
            description="Pick weekdays, local send time, and timezone in Settings — gentle consistency beats cramming."
          />
        </div>
        <LandingInfoPanel accent="indigo">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/85 shadow-sm ring-1 ring-indigo-200/70 dark:bg-white/10 dark:ring-white/10">
              <BellRing className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              After sign-in: open <span className="font-semibold text-slate-900 dark:text-white">Study plan</span> for
              analytics and <span className="font-semibold text-slate-900 dark:text-white">Settings</span> for email
              reminders.
            </p>
          </div>
        </LandingInfoPanel>
      </LandingSection>

      {/* Telegram */}
      <LandingSection id="telegram" ariaLabelledby="section-telegram">
        <LandingSectionHeader
          tagline={LANDING_TELEGRAM.tagline}
          id="section-telegram"
          title={LANDING_TELEGRAM.title}
          description={LANDING_TELEGRAM.description}
        />
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-8">
          {[
            { Icon: Sun, feature: LANDING_TELEGRAM.features[0] },
            { Icon: Moon, feature: LANDING_TELEGRAM.features[1] },
            { Icon: CheckCircle, feature: LANDING_TELEGRAM.features[2] },
          ].map(({ Icon, feature }) => (
            <LandingIconCard
              key={feature.title}
              icon={Icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
        <LandingInfoPanel accent="sky">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2AABEE] text-white shadow-sm shadow-sky-500/30">
              <TelegramIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">@{TELEGRAM_BOT_USERNAME}</p>
              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Daily tips, topics, and short quizzes on your phone. Deep AI scoring, rewrite, and credit packs stay on
                the web lab — so your study sessions and purchases stay in one place.
              </p>
              <LandingMentionLine accent="sky">
                Commands:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">/tip</span>
                <span className="text-sky-700/70 dark:text-sky-400/70"> morning tip</span>
                <span className="mx-1.5 text-sky-600/50 dark:text-sky-500/50" aria-hidden>
                  ·
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">/topic</span>
                <span className="text-sky-700/70 dark:text-sky-400/70"> evening prompt</span>
                <span className="mx-1.5 text-sky-600/50 dark:text-sky-500/50" aria-hidden>
                  ·
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{LANDING_TELEGRAM.resourceCommand}</span>
                <span className="text-sky-700/70 dark:text-sky-400/70"> {LANDING_TELEGRAM.resourceHint}</span>
              </LandingMentionLine>
              <LandingMentionLine accent="sky">
                Channel: tips AM, topic PM · free quick score in bot → full report on the site.{' '}
                <LandingTextLink
                  href={TELEGRAM_BOT_URL}
                  accent="sky"
                  onClick={() => trackTelegramClick({ target: 'bot', placement: 'landing' })}
                >
                  Open bot
                </LandingTextLink>
                <span className="mx-1.5 text-slate-400" aria-hidden>
                  ·
                </span>
                <LandingTextLink
                  href={TELEGRAM_CHANNEL_URL}
                  accent="sky"
                  onClick={() => trackTelegramClick({ target: 'channel', placement: 'landing' })}
                >
                  Join channel
                </LandingTextLink>
              </LandingMentionLine>
            </div>
          </div>
        </LandingInfoPanel>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" ariaLabelledby="section-faq">
        <LandingSectionHeader
          tagline="FAQ"
          id="section-faq"
          title="Frequently asked questions"
          description="Scoring accuracy, Academic & GT support, tutors, Telegram, and data privacy."
        />
        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <motion.div
                key={item.q}
                {...landingFadeInUp}
                className="rounded-[1.75rem] border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="font-bold uppercase tracking-widest text-xs text-slate-900 dark:text-white pr-4">
                    {item.q}
                  </span>
                  <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                    <AnimatePresence mode="wait">
                      {isOpen ? (
                        <motion.span
                          key="minus"
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Minus className="w-4 h-4" strokeWidth={2} aria-hidden />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="plus"
                          initial={{ opacity: 0, rotate: 90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Plus className="w-4 h-4" strokeWidth={2} aria-hidden />
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
      </LandingSection>

      {/* Tutors — secondary audience */}
      <LandingSection id="tutor-tools" ariaLabelledby="section-tutor-tools">
        <LandingSectionHeader
          tagline="For tutors & teachers"
          id="section-tutor-tools"
          title="AI score first — your notes on top"
          description="Check a student essay, add feedback, tweak bands if needed, then share a link or PDF."
        />
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              step: '01',
              title: 'AI draft score',
              body: 'Run Task 1 or Task 2 — same 4-criteria practice report students see.',
            },
            {
              step: '02',
              title: 'Your notes',
              body: 'Add tutor comments under the essay and adjust criterion bands when you disagree.',
            },
            {
              step: '03',
              title: 'Deliver',
              body: 'Save to archive, share a link, or export PDF — notes travel with the report.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-4 text-left dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                {item.step}
              </p>
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onFullAnalysisClick}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Open tutor workspace
          </button>
        </div>
      </LandingSection>

      {/* Methodology */}
      <LandingSection ariaLabelledby="section-methodology">
        <LandingSectionHeader
          tagline="Expert Guidelines"
          id="section-methodology"
          title="STRATUM methodology"
          description="The principles we use to evaluate and improve your writing for Band 7+."
        />
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          <LandingCard>
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-600 dark:text-indigo-400 mb-5">
              Task 1 · Academic
            </h3>
            <ul className="space-y-3">
              {TASK1_TIPS.map((tip) => {
                const Icon = { Eye, Target, Shield, Filter, Zap }[tip.icon];
                return (
                  <li key={tip.id} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    {Icon ? (
                      <Icon className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    <span className="text-sm font-medium">{tip.label}</span>
                  </li>
                );
              })}
            </ul>
          </LandingCard>
          <LandingCard className="border-teal-200/80 dark:border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/15">
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-teal-600 dark:text-teal-400 mb-5">
              Task 1 · GT Letter
            </h3>
            <ul className="space-y-3">
              {LETTER_TIPS.map((tip) => {
                const Icon = { CheckCircle, Shield, Target, FileText, LayoutGrid }[tip.icon];
                return (
                  <li key={tip.id} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    {Icon ? (
                      <Icon className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    <span className="text-sm font-medium">{tip.label}</span>
                  </li>
                );
              })}
            </ul>
          </LandingCard>
          <LandingCard>
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-600 dark:text-indigo-400 mb-5">
              Task 2 · Essay
            </h3>
            <ul className="space-y-3">
              {TASK2_TIPS.map((tip) => {
                const Icon = { Target, LayoutGrid, Crown, Shield, RefreshCw }[tip.icon];
                return (
                  <li key={tip.id} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    {Icon ? (
                      <Icon className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    <span className="text-sm font-medium">{tip.label}</span>
                  </li>
                );
              })}
            </ul>
          </LandingCard>
        </div>
      </LandingSection>

      <NeuralSyncShowcase />
    </main>
  );
}
