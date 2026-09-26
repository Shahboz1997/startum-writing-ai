'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import LandingHeroCheck from '@/components/landing/LandingHeroCheck';
import LandingPricing from '@/components/landing/LandingPricing';
import { LANDING_SCORE_DISCLAIMER } from '@/lib/landingSeoData';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/landingUi';

/**
 * Lightweight Ads landing (no TransformationSlider / NeuralSync / FAQ motion).
 * Pricing block reused as-is — do not reshape pack cards here.
 */
export default function LandingPageCompact({
  onLoginClick,
  onFullAnalysisClick,
  isLoggedIn = false,
}) {
  const router = useRouter();
  const { copy: abCopy } = useLandingAbVariant();

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300 pt-0">
      <Suspense fallback={<div className="min-h-[28rem] bg-[#F9FAFB] dark:bg-[#050505]" aria-hidden />}>
        <LandingHeroCheck
          onLoginClick={onLoginClick}
          isLoggedIn={isLoggedIn}
          onContinueToLab={() => router.push('/?app=1')}
          compact
        />
      </Suspense>

      <LandingSection ariaLabelledby="section-ads-trust">
        <LandingSectionHeader
          tagline="Why Stratum"
          id="section-ads-trust"
          title="Examiner-style feedback in under a minute"
          description="Preliminary practice band without signup. Full criteria, Task 1 data flags, and model rewrite after Google sign-in."
        />
        <p className="mb-6 text-center text-xs font-medium text-slate-500 dark:text-slate-500">
          {LANDING_SCORE_DISCLAIMER}
        </p>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            {
              title: 'Task 1 & Task 2',
              body: 'Charts, GT letters, and essays scored on the four Writing criteria.',
            },
            {
              title: '1 free preview',
              body: 'See a practice band before you register. Unlock the full report in one click.',
            },
            {
              title: 'Credits after free checks',
              body: 'New accounts get 3 full checks. Top up in USD via Lemon Squeezy.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/demo/flagship-writing"
            className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            View sample report
          </Link>
          {' · '}
          <Link
            href="/ielts-academic-task-1-band-score-checker"
            className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            Task 1 checker
          </Link>
        </p>
      </LandingSection>

      <LandingPricing onLoginClick={onLoginClick} isLoggedIn={isLoggedIn} />

      <LandingSection>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Free demo → Sign in → Buy credits
          </h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{abCopy.offerLine}</p>
          <button
            type="button"
            onClick={() => {
              document.getElementById('hero-check')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="btn-stratum inline-flex min-h-11 items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold"
          >
            <span className="btn-stratum-text">Start free demo</span>
          </button>
        </div>
      </LandingSection>
    </main>
  );
}
