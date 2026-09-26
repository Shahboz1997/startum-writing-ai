'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  LandingSection,
  LandingSectionHeader,
  LandingCard,
} from '@/components/landing/landingUi';

/**
 * Conversion hook: Task 1 data/logic mistake before → after (illustrative example, not a user study).
 */
export default function Task1DataErrorDemo() {
  return (
    <LandingSection id="task1-data-errors" ariaLabelledby="section-task1-data">
      <LandingSectionHeader
        tagline="Strongest hook"
        id="section-task1-data"
        title="Task 1 data errors — caught before exam day"
        description="Many Band 6 reports look fluent but invent trends. STRATUM flags logic and data mistakes tutors often miss."
      />
      <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
        <LandingCard className="border-rose-200/80 dark:border-rose-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Before · common draft
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;The chart shows that coffee sales{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              increased steadily from 40% to 25%
            </mark>{' '}
            between 2010 and 2020.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-rose-700/90 dark:text-rose-300/90">
            Data/logic flag: &ldquo;increased&rdquo; contradicts 40% → 25% (a fall). Fluency alone does not save Task
            Achievement.
          </p>
        </LandingCard>
        <LandingCard className="border-emerald-200/80 dark:border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              After · corrected notice
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;The chart shows that coffee sales{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              decreased from 40% to 25%
            </mark>{' '}
            between 2010 and 2020.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-emerald-800/90 dark:text-emerald-300/90">
            Example rewrite only — illustrates the kind of Task 1 logic check in a full STRATUM report. Not a promised
            band outcome.
          </p>
        </LandingCard>
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          href="/demo/task1-academic"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        >
          Open Task 1 sample report
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </LandingSection>
  );
}
