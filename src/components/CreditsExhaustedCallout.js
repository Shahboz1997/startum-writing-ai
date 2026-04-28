'use client';

import React from 'react';
import { LifeBuoy, Sparkles } from 'lucide-react';

export default function CreditsExhaustedCallout({ className = '', onContactSupport }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-indigo-200/80 dark:border-indigo-500/35 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/90 dark:from-indigo-950/50 dark:via-slate-900/80 dark:to-violet-950/40 px-5 py-6 sm:px-8 sm:py-8 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.35)] dark:shadow-[0_24px_60px_-24px_rgba(99,102,241,0.25)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15"
        aria-hidden
      />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:bg-indigo-500 dark:shadow-indigo-500/25">
          <Sparkles className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            No credits left
          </h3>
          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            You have used your included Task&nbsp;1 and Task&nbsp;2 checks. Further analysis is unavailable until you
            top up your credits.
          </p>
          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            For credit purchases, top-ups, and billing questions, contact support.
          </p>
          {typeof onContactSupport === 'function' ? (
            <button
              type="button"
              onClick={onContactSupport}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold tracking-tight text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <LifeBuoy className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Contact support
            </button>
          ) : (
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold tracking-tight text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <LifeBuoy className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Contact support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
