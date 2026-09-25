'use client';

import Link from 'next/link';
import {
  BRAND_LEGAL_LINE,
  COPYRIGHT_SHORT,
  LEGAL_COMPANY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from '@/lib/support';

/** Compact trust footer for Ads / SEO guest landings (Google Misrepresentation checklist). */
export default function LandingLegalFooter() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-white/5 bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 text-center space-y-4">
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Terms of Service
          </Link>
          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
            ·
          </span>
          <Link href="/refund" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Refund Policy
          </Link>
          <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
            ·
          </span>
          <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Pricing
          </Link>
        </nav>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{LEGAL_COMPANY_NAME}</span>
          <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden>
            ·
          </span>
          <a
            href={SUPPORT_MAILTO}
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden>
            ·
          </span>
          <a href={SUPPORT_PHONE_TEL} className="hover:text-indigo-600 dark:hover:text-indigo-400">
            {SUPPORT_PHONE}
          </a>
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-500">{BRAND_LEGAL_LINE}</p>
        <p className="text-xs font-medium tracking-tight text-slate-500 dark:text-slate-500">
          {COPYRIGHT_SHORT}
        </p>
      </div>
    </footer>
  );
}
