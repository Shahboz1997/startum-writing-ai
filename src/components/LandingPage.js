'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@wrksz/themes/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import TransformationSlider from '@/components/TransformationSlider';
import Task2ComparisonLab from '@/components/Task2ComparisonLab';
import {
  BarChart3,
  CheckCircle,
  Star,
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
  MessageCircle,
} from 'lucide-react';
import { TASK1_TIPS, TASK2_TIPS, LETTER_TIPS } from '@/lib/ieltsGuidelines';
import NeuralSyncShowcase from '@/components/NeuralSyncShowcase';
import LandingSampleReports from '@/components/landing/LandingSampleReports';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingLemonTestCheckout from '@/components/landing/LandingLemonTestCheckout';
import LandingHeroCheck from '@/components/landing/LandingHeroCheck';
import TelegramIcon from '@/components/icons/TelegramIcon';
import {
  TELEGRAM_BOT_URL,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/support';
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
  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  useEffect(() => setThemeMounted(true), []);

  const darkMode = themeMounted && resolvedTheme === 'dark';

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

      {/* Workflow */}
      <LandingSection ariaLabelledby="section-workflow">
        <LandingSectionHeader
          tagline="Workflow"
          id="section-workflow"
          title="From prompt to band breakthrough"
          description="Generate, write, score, and fix — then track progress from your saved checks."
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

      {/* Tutors */}
      <LandingSection id="tutor-tools" ariaLabelledby="section-tutor-tools">
        <LandingSectionHeader
          tagline="For tutors & teachers"
          id="section-tutor-tools"
          title="Personal feedback, one-click export"
          description="AI scoring plus a tutor workspace — notes under the essay, manual band tweaks, then deliver the report."
        />
        <div className="mx-auto max-w-2xl">
          <LandingInfoPanel accent="amber">
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Tutor&apos;s notes</p>
              <span className="ml-auto text-[10px] font-semibold tabular-nums text-amber-700/70 dark:text-amber-400/70">
                0 / 2000
              </span>
            </div>
            <div className="min-h-[100px] rounded-xl border border-amber-200/90 dark:border-amber-500/20 bg-white dark:bg-slate-900/50 px-3.5 py-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Focus on thesis clarity in paragraph 1. Swap &ldquo;good&rdquo; for more academic lexis. Homework: one body
              paragraph using &ldquo;Furthermore&rdquo;…
            </div>
            <LandingMentionLine accent="amber" className="mt-3">
              Notes sit below the student draft · adjust criterion scores in the results panel · then{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">Save to Archive</span>
              <span className="mx-1.5 text-amber-600/50 dark:text-amber-500/50" aria-hidden>
                ·
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Share</span>
              <span className="mx-1.5 text-amber-600/50 dark:text-amber-500/50" aria-hidden>
                ·
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Official PDF</span>
              <span className="text-amber-700/70 dark:text-amber-400/70"> — included in every format.</span>
            </LandingMentionLine>
            <LandingMentionLine accent="amber" className="mt-2">
              <button
                type="button"
                onClick={onFullAnalysisClick}
                className="font-semibold text-amber-800 underline decoration-amber-300/80 underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:decoration-amber-600/50"
              >
                Open tutor workspace
              </button>
            </LandingMentionLine>
          </LandingInfoPanel>
        </div>
      </LandingSection>

      <NeuralSyncShowcase onCtaClick={onFullAnalysisClick} />

      <LandingSampleReports onTryDemoClick={() => router.push('/?app=1')} />

      {/* Progress & study plan (merged analytics + dashboard) */}
      <LandingSection id="study-plan" ariaLabelledby="section-study-plan">
        <LandingSectionHeader
          tagline="Progress"
          id="section-study-plan"
          title="Analytics, study plan & reminders"
          description="Every saved check feeds your writing profile — criterion trends, weak-area links, and optional email nudges."
        />
        <motion.div {...landingFadeInUp} className="mb-10">
          <TransformationSlider darkMode={darkMode} onCtaClick={onFullAnalysisClick} />
        </motion.div>
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
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                After sign-in: open <span className="font-semibold text-slate-900 dark:text-white">Study plan</span> for
                analytics and <span className="font-semibold text-slate-900 dark:text-white">Settings</span> for email
                reminders.
              </p>
              <LandingMentionLine accent="indigo">
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="font-semibold text-indigo-700 underline decoration-indigo-300/80 underline-offset-2 hover:text-indigo-800 dark:text-indigo-300 dark:decoration-indigo-600/50"
                >
                  Sign in to unlock
                </button>
              </LandingMentionLine>
            </div>
          </div>
        </LandingInfoPanel>
      </LandingSection>

      <section className="py-8 sm:py-10 bg-[#F9FAFB] dark:bg-[#050505] border-b border-slate-200/50 dark:border-white/5">
        <Task2ComparisonLab darkMode={darkMode} />
      </section>

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

      {/* Testimonials */}
      <LandingSection ariaLabelledby="section-testimonials">
        <LandingSectionHeader
          tagline="Testimonials"
          id="section-testimonials"
          title="Trusted by students worldwide"
          description="Precision feedback and stratum-level analytics helping learners reach their target band."
        />
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {[
            {
              quote:
                "Stratum's feedback is remarkably accurate. It identified errors my tutor had missed. I went from 6.0 to 7.5 in three weeks.",
              author: 'Ahmed',
              location: 'Saudi Arabia',
              band: '6.0 → 7.5',
            },
            {
              quote:
                'The vocabulary upgrades are a game-changer. It taught me how to achieve a native-level academic register.',
              author: 'Lin',
              location: 'China',
              band: '6.5 → 8.0',
            },
          ].map((item) => (
            <LandingCard key={item.author}>
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={1.5} aria-hidden />
                ))}
                <span className="text-xs font-semibold text-red-500 ml-1">{item.band}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {item.author}, {item.location}
              </p>
            </LandingCard>
          ))}
        </div>
      </LandingSection>

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
              Ready to reach Band 7.5+?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6 leading-relaxed max-w-xl mx-auto">
              {abCopy.offerLine}
            </p>
            <button
              type="button"
              onClick={() => router.push('/?app=1')}
              className="btn-stratum px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
              data-ab-variant={abCopy.id}
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">{abCopy.bottomCta}</span>
            </button>
          </motion.div>
        </div>
      </section>

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
                Channel: twice-daily posts (tips AM, topic PM).{' '}
                <LandingTextLink href={TELEGRAM_BOT_URL} accent="sky">
                  Open bot
                </LandingTextLink>
                <span className="mx-1.5 text-slate-400" aria-hidden>
                  ·
                </span>
                <LandingTextLink href={TELEGRAM_CHANNEL_URL} accent="sky">
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
    </main>
  );
}
