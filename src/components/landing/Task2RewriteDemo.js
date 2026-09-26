'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  LandingSection,
  LandingSectionHeader,
  LandingCard,
} from '@/components/landing/landingUi';

/**
 * Task 2 draft vs model rewrite — same card layout as Task1DataErrorDemo.
 * Illustrative only — not a promised band outcome.
 */
export default function Task2RewriteDemo() {
  return (
    <LandingSection id="task2-rewrite" ariaLabelledby="section-task2-rewrite">
      <LandingSectionHeader
        tagline="Task 2"
        id="section-task2-rewrite"
        title="Draft vs model rewrite"
        description="B2 wording upgraded to academic Task 2 register — connectors, precise verbs, and clearer stance. Same idea as the rewrite in a full report."
      />
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <LandingCard className="border-rose-200/80 dark:border-rose-500/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Before · weak draft
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              I think
            </mark>{' '}
            that technology is{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              good
            </mark>{' '}
            for education. It helps students learn things faster and it is{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              easy
            </mark>{' '}
            to find information on the internet. But some people say it is{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              bad
            </mark>{' '}
            because students get{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              lazy
            </mark>
            .{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              In the end
            </mark>
            , I believe technology is{' '}
            <mark className="rounded bg-rose-100 px-0.5 text-rose-900 dark:bg-rose-500/30 dark:text-rose-100">
              very helpful
            </mark>{' '}
            for everyone in schools.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-rose-700/90 dark:text-rose-300/90">
            Flags: personal opener, basic adjectives, weak conclusion — hurts Lexical Resource and Task Response
            clarity.
          </p>
        </LandingCard>
        <LandingCard className="border-emerald-200/80 dark:border-emerald-500/20">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              After · model rewrite
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              It is widely argued that
            </mark>{' '}
            digital technology has{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              revolutionized
            </mark>{' '}
            education.{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              While
            </mark>{' '}
            critics worry about{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              intellectual passivity
            </mark>
            , I{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              assert
            </mark>{' '}
            that access to information{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              repositories
            </mark>{' '}
            enhances research efficiency.{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              Ultimately
            </mark>
            , when used strategically, these tools{' '}
            <mark className="rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100">
              foster
            </mark>{' '}
            a more dynamic learning environment.&rdquo;
          </p>
          <p className="mt-3 text-xs font-medium text-emerald-800/90 dark:text-emerald-300/90">
            Example rewrite only — academic openers, precise lexis, clearer cohesion. Not a promised band outcome.
          </p>
        </LandingCard>
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          href="/demo/task2-band-75"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        >
          Open Task 2 sample report
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </LandingSection>
  );
}
