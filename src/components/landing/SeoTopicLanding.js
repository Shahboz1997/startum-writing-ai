import Link from 'next/link';
import { LANDING_SCORE_DISCLAIMER } from '@/lib/landingSeoData';

/**
 * Thin SEO topic landing: one H1, benefit copy, demo CTA, FAQ — no keyword stuffing.
 * @param {{
 *   h1: string,
 *   lead: string,
 *   benefits: string[],
 *   faq: { q: string, a: string }[],
 *   demoHref?: string,
 *   secondaryHref?: string,
 *   secondaryLabel?: string,
 * }} props
 */
export default function SeoTopicLanding({
  h1,
  lead,
  benefits = [],
  faq = [],
  demoHref = '/?landing=1#hero-check',
  secondaryHref = '/demo/flagship-writing',
  secondaryLabel = 'View sample report',
}) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505]">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          ← STRATUM home
        </Link>

        <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {h1}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">{lead}</p>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-500">{LANDING_SCORE_DISCLAIMER}</p>

        {benefits.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {benefits.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <nav className="mt-10 flex flex-col gap-3 sm:flex-row" aria-label="Get started">
          <Link
            href={demoHref}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500"
          >
            Free demo check
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            {secondaryLabel}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            Credit packs (USD)
          </Link>
        </nav>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
          Path: Free demo → Sign in → 3 free checks. Checkout stays in USD via Lemon Squeezy.
        </p>

        {faq.length > 0 ? (
          <section className="mt-14" aria-labelledby="topic-faq-heading">
            <h2 id="topic-faq-heading" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              FAQ
            </h2>
            <div className="mt-6 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
