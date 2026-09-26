import Link from 'next/link';
import { CREDIT_PACKS, formatPackPrice, formatPerCreditPrice, getPackValueBadge } from '@/lib/creditPacks';
import { LEGAL_COMPANY_NAME, BUSINESS_ADDRESS, SUPPORT_EMAIL } from '@/lib/support';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';

const baseUrl = getMetadataBaseUrl();
const META_TITLE = 'Pricing — IELTS Writing credit packs (USD)';
const META_DESCRIPTION =
  'STRATUM credit packs for AI IELTS Writing checks: 10, 20, or 40 credits in USD. Free demo first, then sign in. Secure Lemon Squeezy checkout.';

export const metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl.replace(/\/$/, '')}/pricing`,
    siteName: 'STRATUM',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'STRATUM IELTS Writing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  const creditLabel = (n) => (Number(n) === 1 ? '1 credit' : `${n} credits`);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          ← Back to Home
        </Link>

        <p className="mt-8 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white sm:text-4xl">
          Credit packs (USD)
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          One credit equals one full AI essay analysis (Task 1 or Task 2). Start with a free demo, sign in for
          included checks, then top up when you need more. Credits are digital software access delivered
          automatically after payment. Checkout is processed securely by Lemon Squeezy in USD (not localized).
          Operated by {LEGAL_COMPANY_NAME}.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const valueBadge = getPackValueBadge(pack);
            return (
            <li
              key={pack.id}
              className={`rounded-2xl border bg-white p-5 dark:bg-slate-950 ${
                pack.popular
                  ? 'border-2 border-slate-900 dark:border-white'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {valueBadge ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {valueBadge}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {pack.name}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {creditLabel(pack.credits)}
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {formatPackPrice(pack.priceUsd)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatPerCreditPrice(pack)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {pack.blurb}
              </p>
            </li>
            );
          })}
        </ul>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          <p>
            Path:{' '}
            <Link href="/?landing=1#hero-check" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              free demo
            </Link>
            {' → '}
            <Link href="/?app=1" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              sign in
            </Link>
            {' → buy credits from Pricing on the home page or Get more credits in the writing lab.'}
          </p>
          <p className="mt-3">
            Refunds: see our{' '}
            <Link href="/refund" className="underline underline-offset-2 hover:text-indigo-600">
              Refund Policy
            </Link>
            . Questions:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {LEGAL_COMPANY_NAME} · {BUSINESS_ADDRESS}
          </p>
        </div>
      </div>
    </div>
  );
}
