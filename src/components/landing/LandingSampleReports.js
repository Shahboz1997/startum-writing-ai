'use client';

import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { DEMO_PATHS, DEMO_LANDING_SAMPLES } from '@/lib/demoReportPaths';
import {
  LandingSection,
  LandingSectionHeader,
  LandingCard,
} from '@/components/landing/landingUi';

/**
 * Evergreen sample reports — conversion magnet (unique CTAs: open reports only).
 */
export default function LandingSampleReports() {
  return (
    <LandingSection id="sample-reports" ariaLabelledby="section-sample-reports">
      <LandingSectionHeader
        tagline="Sample reports"
        id="section-sample-reports"
        title="See a real examiner report"
        description="Snapshots from the same Analyze pipeline — not mock UI. Open a report, then use Check free at the top for your own excerpt."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {DEMO_LANDING_SAMPLES.map((item) => (
          <LandingCard key={item.href}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:ring-indigo-500/20">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
              </div>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 dark:bg-white/10 dark:text-slate-200">
                Band {item.band}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{item.blurb}</p>
            <Link
              href={item.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Open full report
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </LandingCard>
        ))}
      </div>
      <div className="flex justify-center">
        <Link
          href={DEMO_PATHS.flagship}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          Flagship sample (Task 1 + Task 2)
        </Link>
      </div>
    </LandingSection>
  );
}
