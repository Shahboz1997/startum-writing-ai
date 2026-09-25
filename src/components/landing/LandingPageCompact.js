'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import LandingHeroCheck from '@/components/landing/LandingHeroCheck';
import LandingPricing from '@/components/landing/LandingPricing';
import {
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/landingUi';

/**
 * Lightweight Ads landing (no TransformationSlider / NeuralSync / FAQ motion).
 * Use from `/ads` for Google Ads PageSpeed.
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
          description="Preliminary band without signup. Full criteria, errors, and Band 9 rewrite after Google sign-in."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          {[
            {
              title: 'Message-matched scoring',
              body: 'Task 1 charts, GT letters, and Task 2 essays — same criteria IELTS uses.',
            },
            {
              title: '1 free preview',
              body: 'See your band before you register. Unlock the full report in one click.',
            },
            {
              title: 'Credits after free checks',
              body: 'New accounts get 3 full checks. Top up securely via Lemon Squeezy.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-4"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingPricing onLoginClick={onLoginClick} isLoggedIn={isLoggedIn} />

      <LandingSection>
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Ready for the full report?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{abCopy.offerLine}</p>
          <button
            type="button"
            onClick={() => {
              if (typeof onFullAnalysisClick === 'function') onFullAnalysisClick();
              else onLoginClick?.(abCopy.offerLine);
            }}
            className="btn-stratum inline-flex min-h-11 items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold"
          >
            <span className="btn-stratum-text">{abCopy.bottomCta}</span>
          </button>
        </div>
      </LandingSection>
    </main>
  );
}
