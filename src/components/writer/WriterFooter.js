'use client';

import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  COPYRIGHT_LINE,
  FACEBOOK_PAGE_LABEL,
  FACEBOOK_PAGE_URL,
  INSTAGRAM_PAGE_LABEL,
  INSTAGRAM_PAGE_URL,
  LEGAL_COMPANY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  TELEGRAM_CHANNEL_LABEL,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/support';
import FacebookIcon from '@/components/icons/FacebookIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import TelegramIcon from '@/components/icons/TelegramIcon';
import WriterFeedbackForm from '@/components/writer/footer/WriterFeedbackForm';
import { WriterFooterBrand, WriterFooterLegal, WriterFooterResources } from '@/components/writer/footer/WriterFooterNav';
import WriterShareModal from '@/components/writer/footer/WriterShareModal';
import WriterSupportModal from '@/components/writer/footer/WriterSupportModal';
import WriterScrollTopButton from '@/components/writer/footer/WriterScrollTopButton';

function MinimalLegalLinks() {
  return (
    <nav
      aria-label="Legal"
      className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
    >
      <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        Terms
      </Link>
      <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        Privacy
      </Link>
      <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <Link href="/refund" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        Refund
      </Link>
      <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        Pricing
      </Link>
      <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <a
        href={SUPPORT_MAILTO}
        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {SUPPORT_EMAIL}
      </a>
      <span className="text-slate-300 dark:text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <span>{LEGAL_COMPANY_NAME}</span>
    </nav>
  );
}

export default function WriterFooter({
  minimal = false,
  darkMode,
  activeTab,
  setActiveTab,
  onLoginClick,
  onSubmitFeedback,
  feedbackBanner,
  shareModal,
  setShareModal,
  copyShareLink,
  nativeShareLink,
  showSupportModal,
  setShowSupportModal,
  supportFirstFieldRef,
  showScrollTop,
  scrollProgress,
  onScrollToTop,
}) {
  return (
    <footer className="border-t border-white/5 bg-[#F9FAFB] dark:bg-[#050505] transition-colors">
      <div
        className={
          minimal
            ? 'mx-auto max-w-5xl px-4 py-8 sm:py-10 text-center'
            : 'mx-auto w-full max-w-7xl xl:max-w-screen-2xl px-3 sm:px-6 lg:px-8 xl:px-10 py-12 lg:py-16'
        }
      >
        {!minimal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <WriterFooterBrand />
            <WriterFooterResources activeTab={activeTab} setActiveTab={setActiveTab} onLoginClick={onLoginClick} />

            <div id="stratum-feedback-section" className="relative scroll-mt-24 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight mb-4">Feedback</h4>
              <WriterFeedbackForm darkMode={darkMode} onSubmit={onSubmitFeedback} />
            </div>

            <WriterFooterLegal />
          </div>
        )}

        <div className={minimal ? 'space-y-3' : 'mt-12 pt-8 border-t border-white/5 text-center space-y-2'}>
          {minimal ? <MinimalLegalLinks /> : null}
          <p
            className={
              minimal
                ? 'text-xs sm:text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400'
                : 'text-sm font-semibold tracking-tight text-slate-900 dark:text-white'
            }
          >
            {COPYRIGHT_LINE}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 text-xs text-slate-500 dark:text-slate-400">
            {!minimal && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="inline-flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact support
                </button>
                <span className="text-slate-400/70 select-none" aria-hidden="true">
                  ·
                </span>
              </>
            )}
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={TELEGRAM_CHANNEL_LABEL}
              className="inline-flex items-center hover:text-[#229ED9] dark:hover:text-[#229ED9] transition-colors"
            >
              <TelegramIcon className="h-4 w-4 shrink-0 text-[#229ED9]" />
            </a>
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={FACEBOOK_PAGE_LABEL}
              className="inline-flex items-center hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-colors"
            >
              <FacebookIcon className="h-4 w-4 shrink-0 text-[#1877F2]" />
            </a>
            <a
              href={INSTAGRAM_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={INSTAGRAM_PAGE_LABEL}
              className="inline-flex items-center hover:text-[#E4405F] dark:hover:text-[#E4405F] transition-colors"
            >
              <InstagramIcon className="h-4 w-4 shrink-0 text-[#E4405F]" />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {shareModal && (
          <WriterShareModal
            darkMode={darkMode}
            shareModal={shareModal}
            setShareModal={setShareModal}
            copyShareLink={copyShareLink}
            nativeShareLink={nativeShareLink}
          />
        )}
        {showSupportModal && (
          <WriterSupportModal
            darkMode={darkMode}
            showSupportModal={showSupportModal}
            setShowSupportModal={setShowSupportModal}
            feedbackBanner={feedbackBanner}
            onSubmitFeedback={onSubmitFeedback}
            supportFirstFieldRef={supportFirstFieldRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollTop && (
          <WriterScrollTopButton
            darkMode={darkMode}
            showScrollTop={showScrollTop}
            scrollProgress={scrollProgress}
            onScrollToTop={onScrollToTop}
          />
        )}
      </AnimatePresence>
    </footer>
  );
}
