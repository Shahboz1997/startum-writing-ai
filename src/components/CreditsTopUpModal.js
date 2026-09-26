'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import {
  CREDIT_PACKS,
  CREDITS_TOP_UP_FOOTER,
  CREDITS_TOP_UP_NOTICE,
  formatPackPrice,
  formatPerCreditPrice,
  getPackValueBadge,
} from '@/lib/creditPacks';
import { trackCheckoutClick } from '@/lib/analyticsEvents';

/**
 * Credit pack picker → Lemon Squeezy checkout redirect.
 */
export default function CreditsTopUpModal({
  isOpen,
  onClose,
  title = 'Get more credits',
  subtitle = "You've used your free checks. Choose a credit pack to keep analyzing essays.",
}) {
  const titleId = useId();
  const [checkoutPackId, setCheckoutPackId] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev) => {
      if (ev.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutPackId('');
      setCheckoutError('');
    }
  }, [isOpen]);

  const startCheckout = useCallback(
    async (packId) => {
      if (checkoutPackId) return;
      trackCheckoutClick({ packId, source: 'credits_modal' });
      setCheckoutPackId(packId);
      setCheckoutError('');
      try {
        const res = await fetch('/api/checkout/lemon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Could not start checkout');
        }
        if (!data?.checkoutUrl) {
          throw new Error('Checkout URL missing from server response');
        }
        window.location.assign(data.checkoutUrl);
      } catch (err) {
        setCheckoutError(err?.message || 'Checkout failed');
        setCheckoutPackId('');
      }
    },
    [checkoutPackId]
  );

  const creditLabel = (n) => (Number(n) === 1 ? '1 credit' : `${n} credits`);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-label="Close credit packages"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white shadow-[0_28px_80px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)] sm:max-h-[min(92dvh,720px)] sm:rounded-3xl max-h-[min(92dvh,100%)] pb-[env(safe-area-inset-bottom)]"
          >
            <div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden"
              aria-hidden
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5 sm:px-8 sm:pb-8 sm:pt-9">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-1">
                  <h2
                    id={titleId}
                    className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                  >
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl bg-slate-100 px-3.5 py-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:mt-5 sm:px-4"
                role="note"
              >
                {CREDITS_TOP_UP_NOTICE}
              </div>

              {checkoutError ? (
                <p
                  className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                  role="alert"
                >
                  {checkoutError}
                </p>
              ) : null}

              <ul className="mt-4 space-y-3 sm:mt-5" aria-label="Credit packs">
                {CREDIT_PACKS.map((pack) => {
                  const isPopular = Boolean(pack.popular);
                  const valueBadge = getPackValueBadge(pack);
                  const busy = checkoutPackId === pack.id;
                  const disabled = Boolean(checkoutPackId);
                  return (
                    <li key={pack.id} className="relative pt-2">
                      {valueBadge ? (
                        <span className="absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:bg-slate-950 dark:text-white sm:left-4">
                          {valueBadge}
                        </span>
                      ) : null}
                      <div
                        className={`flex flex-col gap-3 rounded-2xl border bg-white p-3.5 dark:bg-slate-950 min-[380px]:flex-row min-[380px]:items-center sm:gap-3 sm:px-4 sm:py-3.5 ${
                          isPopular
                            ? 'border-2 border-slate-900 dark:border-white'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                            {creditLabel(pack.credits)}
                          </p>
                          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                            {formatPackPrice(pack.priceUsd)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatPerCreditPrice(pack)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startCheckout(pack.id)}
                          disabled={disabled}
                          className={`inline-flex min-h-12 w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors min-[380px]:min-w-[7.5rem] min-[380px]:w-auto disabled:opacity-60 disabled:pointer-events-none ${
                            isPopular
                              ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                              : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                          }`}
                        >
                          {busy ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              Redirecting…
                            </>
                          ) : (
                            'Select'
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {CREDITS_TOP_UP_FOOTER}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
