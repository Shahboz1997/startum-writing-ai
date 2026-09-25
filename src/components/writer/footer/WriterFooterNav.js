'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LEGAL_COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support';

const NAV_TABS = ['Home', 'Task 1', 'Task 2'];

export function WriterFooterBrand() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 dark:bg-indigo-500/15 sm:h-9 sm:w-9"
          aria-hidden
        >
          <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" strokeWidth={2} />
        </span>
        <span className="font-black normal-case text-base tracking-[0.12em] text-slate-900 dark:text-white sm:text-xl sm:tracking-[0.15em]">
          STRATUM
        </span>
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-400">AI IELTS Examiner</p>
    </div>
  );
}

export function WriterFooterResources({ activeTab, setActiveTab, onLoginClick }) {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight mb-4">Resources</h4>
      <ul className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
        {NAV_TABS.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => {
                setActiveTab(t);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-sm font-medium tracking-tight transition-colors ${
                activeTab === t
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {t}
            </button>
          </li>
        ))}
        <li>
          {isLoggedIn ? (
            <Link
              href="/history"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Archive
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onLoginClick?.('Sign in to view your archive.')}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Archive
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}

export function WriterFooterLegal() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight mb-4">Legal</h4>
      <ul className="space-y-3">
        <li>
          <Link
            href="/pricing"
            className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Pricing
          </Link>
        </li>
        <li>
          <Link
            href="/privacy"
            className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link
            href="/data-deletion"
            className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Data Deletion
          </Link>
        </li>
        <li>
          <Link
            href="/terms"
            className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Terms of Service
          </Link>
        </li>
        <li>
          <Link
            href="/refund"
            className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Refund Policy
          </Link>
        </li>
      </ul>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-6 leading-relaxed">
        Independent AI software. Not affiliated with IDP or British Council. For educational use only.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 leading-relaxed">
        {LEGAL_COMPANY_NAME} ·{' '}
        <a
          href={SUPPORT_MAILTO}
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
