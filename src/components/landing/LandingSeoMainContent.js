import Link from 'next/link';
import {
  LANDING_FAQ_ITEMS,
  LANDING_FEATURES,
  LANDING_HERO,
  LANDING_SCORE_DISCLAIMER,
  LANDING_TELEGRAM,
  LANDING_WORKFLOW_STEPS,
} from '@/lib/landingSeoData';
import { TELEGRAM_BOT_URL, TELEGRAM_CHANNEL_URL } from '@/lib/support';
import LandingAbOfferLine from '@/components/landing/LandingAbOfferLine';
import LandingSeoSignInButton from '@/components/landing/LandingSeoSignInButton';

/**
 * Server-rendered marketing HTML for crawlers and first paint (SEO).
 * Interactive animations live in LandingPage (client), loaded separately.
 */
export default function LandingSeoMainContent() {
  return (
    <article className="bg-[#F9FAFB] text-slate-900 dark:bg-[#050505] dark:text-slate-100">
      <header className="border-b border-slate-200/80 dark:border-white/10 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {LANDING_HERO.tagline}
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
            {LANDING_HERO.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            {LANDING_HERO.description}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs font-medium text-slate-500 dark:text-slate-500">
            {LANDING_SCORE_DISCLAIMER} · Free demo → Sign in → 3 free checks (top up later in USD)
          </p>
          <LandingAbOfferLine className="mx-auto mt-4 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400" />
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Primary actions">
            <a
              href="/demo/flagship-writing"
              className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500"
            >
              View sample report
            </a>
            <a
              href="/?landing=1#hero-check"
              className="inline-flex rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Free demo check
            </a>
            <LandingSeoSignInButton className="inline-flex rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800" />
          </nav>
        </div>
      </header>

      <section
        id="how-it-works"
        className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10"
        aria-labelledby="workflow-heading"
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="workflow-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600 dark:text-slate-300">
            Paste → 4 criteria → fixes → rewrite
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_WORKFLOW_STEPS.map((step) => (
              <li
                key={step.step}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Step {step.step}
                </span>
                <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {LANDING_FEATURES.map((f) => f.description).join(' ')}
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sample reports:{' '}
            <a className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400" href="/demo/flagship-writing">
              Flagship (Task 1 + Task 2)
            </a>
            {' · '}
            <a className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400" href="/demo/task2-band-55">
              Task 2 Band 5.5
            </a>
            {' · '}
            <a className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400" href="/demo/task2-band-75">
              Task 2 Band 7.5
            </a>
            {' · '}
            <a className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400" href="/demo/task1-academic">
              Task 1 Academic
            </a>
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-slate-600 dark:text-slate-300">
            Topic pages:{' '}
            <a className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400" href="/ielts-writing-task-2-ai-checker">
              Task 2 AI checker
            </a>
            {' · '}
            <a
              className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
              href="/ielts-academic-task-1-band-score-checker"
            >
              Academic Task 1 checker
            </a>
            {' · '}
            <a
              className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
              href="/ielts-general-training-letter-feedback"
            >
              GT letter feedback
            </a>
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {LANDING_FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <summary className="cursor-pointer list-none font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="telegram"
        className="border-b border-slate-200/80 px-4 py-12 dark:border-white/10"
        aria-labelledby="telegram-heading"
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="telegram-heading" className="text-center text-2xl font-black uppercase tracking-tight">
            {LANDING_TELEGRAM.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {LANDING_TELEGRAM.description}
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {LANDING_TELEGRAM.features.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-sky-200/80 bg-white p-5 dark:border-sky-800/40 dark:bg-slate-900/60"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.description}</p>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Free quick score in Telegram → full report on the site.{' '}
            <a href={TELEGRAM_BOT_URL} className="font-semibold text-sky-700 underline dark:text-sky-300">
              {LANDING_TELEGRAM.cta}
            </a>
            {' · '}
            <a href={TELEGRAM_CHANNEL_URL} className="font-semibold text-sky-700 underline dark:text-sky-300">
              {LANDING_TELEGRAM.channelCta}
            </a>
          </p>
        </div>
      </section>

      <section className="px-4 py-10 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ready to practice?{' '}
          <Link href="/?landing=1#hero-check" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
            Start free demo
          </Link>{' '}
          or{' '}
          <Link href="/landing" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">
            view the full interactive tour
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
