'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  CREDIT_PACKS,
  formatPackPrice,
  formatPerCreditPrice,
} from '@/lib/creditPacks';
import { LandingSection, LandingSectionHeader } from '@/components/landing/landingUi';

/**
 * Hidden Lemon Squeezy test checkout on the landing page.
 * Visible only when URL has ?lemon=1 or the signed-in user is an admin.
 */
export default function LandingLemonTestCheckout({ isLoggedIn, onLoginClick }) {
  const searchParams = useSearchParams();
  const lemonQuery = searchParams?.get('lemon') === '1';

  const [adminOk, setAdminOk] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [checkoutPackId, setCheckoutPackId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lemonQuery) {
      setAdminOk(false);
      setAdminChecked(true);
      return;
    }
    if (!isLoggedIn) {
      setAdminOk(false);
      setAdminChecked(true);
      return;
    }
    let cancelled = false;
    fetch('/api/user/admin-status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setAdminOk(Boolean(data?.admin));
      })
      .catch(() => {
        if (!cancelled) setAdminOk(false);
      })
      .finally(() => {
        if (!cancelled) setAdminChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, lemonQuery]);

  const visible = lemonQuery || (adminChecked && adminOk);

  const startCheckout = useCallback(
    async (packId) => {
      if (checkoutPackId) return;
      setError('');

      if (!isLoggedIn) {
        onLoginClick?.(
          'Sign in to run a Lemon Squeezy test checkout. Keep ?lemon=1 in the URL.'
        );
        return;
      }

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

  if (!visible) return null;

  const creditLabel = (n) => (Number(n) === 1 ? '1 credit' : `${n} credits`);

  return (
    <LandingSection id="lemon-test" ariaLabelledby="section-lemon-test">
      <LandingSectionHeader
        tagline="Internal test"
        id="section-lemon-test"
        title="Lemon Squeezy checkout"
        description="Visible with ?lemon=1 or for admin accounts only. Uses the same checkout API as in-app credit packs."
      />

      <div
        className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
        role="note"
      >
        Test / sandbox payments only. Guests will be asked to sign in first. After payment you return
        with <code className="text-xs">?credits=success</code>.
      </div>

      {error ? (
        <p
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="mx-auto max-w-lg space-y-3" aria-label="Test credit packs">
        {CREDIT_PACKS.map((pack) => {
          const isPopular = Boolean(pack.popular);
          const busy = checkoutPackId === pack.id;
          const disabled = Boolean(checkoutPackId);
          return (
            <li key={pack.id}>
              <div
                className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-950 min-[400px]:flex-row min-[400px]:items-center ${
                  isPopular
                    ? 'border-2 border-slate-900 dark:border-white'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    {creditLabel(pack.credits)}
                    {isPopular ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Popular
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
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
                  className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors min-[400px]:w-auto disabled:opacity-60 disabled:pointer-events-none ${
                    isPopular
                      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                      : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Redirecting…
                    </>
                  ) : isLoggedIn ? (
                    'Pay with Lemon'
                  ) : (
                    'Sign in to pay'
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
