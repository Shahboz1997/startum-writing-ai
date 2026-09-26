'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  CREDIT_PACKS,
  formatPackPrice,
  formatPerCreditPrice,
  getPackValueBadge,
} from '@/lib/creditPacks';
import { LandingSection, LandingSectionHeader } from '@/components/landing/landingUi';
import { trackCheckoutClick } from '@/lib/analyticsEvents';

/**
 * Public pricing for Lemon Squeezy / visitors.
 * Buy → Lemon checkout when signed in; otherwise open auth.
 */
export default function LandingPricing({ isLoggedIn = false, onLoginClick }) {
  const [checkoutPackId, setCheckoutPackId] = useState('');
  const [error, setError] = useState('');

  const startCheckout = useCallback(
    async (packId) => {
      if (checkoutPackId) return;
      setError('');

      if (!isLoggedIn) {
        onLoginClick?.('Sign in to purchase credits. Packs unlock after your free checks.');
        return;
      }

      trackCheckoutClick({ packId, source: 'landing_pricing' });
      setCheckoutPackId(packId);
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
          throw new Error('Checkout URL missing');
        }
        window.location.assign(data.checkoutUrl);
      } catch (err) {
        setError(err?.message || 'Checkout failed');
        setCheckoutPackId('');
      }
    },
    [checkoutPackId, isLoggedIn, onLoginClick]
  );

  const creditLabel = (n) => (Number(n) === 1 ? '1 credit' : `${n} credits`);

  return (
    <LandingSection id="pricing" ariaLabelledby="section-pricing">
      <LandingSectionHeader
        tagline="Pricing"
        id="section-pricing"
        title="Credit packs"
        description="One credit = one full AI essay check (Task 1 or Task 2). Secure checkout via Lemon Squeezy. Credits are added to your account automatically after payment."
      />

      {error ? (
        <p
          className="mx-auto mb-4 max-w-lg rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3" aria-label="Credit packs">
        {CREDIT_PACKS.map((pack) => {
          const isPopular = Boolean(pack.popular);
          const valueBadge = getPackValueBadge(pack);
          const busy = checkoutPackId === pack.id;
          const disabled = Boolean(checkoutPackId);
          return (
            <li key={pack.id} className="relative pt-2">
              {valueBadge ? (
                <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-[#F9FAFB] px-2 text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:bg-[#050505] dark:text-white">
                  {valueBadge}
                </span>
              ) : null}
              <div
                className={`flex h-full flex-col rounded-2xl border bg-white p-5 dark:bg-slate-950 ${
                  isPopular
                    ? 'border-2 border-slate-900 dark:border-white'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{pack.name}</p>
                <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {creditLabel(pack.credits)}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatPackPrice(pack.priceUsd)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatPerCreditPrice(pack)}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {pack.blurb}
                </p>
                <button
                  type="button"
                  onClick={() => startCheckout(pack.id)}
                  disabled={disabled}
                  className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 ${
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
                  ) : isLoggedIn ? (
                    'Buy credits'
                  ) : (
                    'Sign in to buy'
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Digital product delivered automatically. New accounts include free starter checks. See our{' '}
        <a href="/refund" className="underline underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400">
          Refund Policy
        </a>
        .
      </p>
    </LandingSection>
  );
}
