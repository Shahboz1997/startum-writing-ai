import Link from 'next/link';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { GUIDES, GUIDES_PAGE } from '@/lib/guides';
import GuidesPageClient from '@/components/guides/GuidesPageClient';

const baseUrl = getMetadataBaseUrl();
const META_TITLE = GUIDES_PAGE.title;
const META_DESCRIPTION = GUIDES_PAGE.description;
const canonicalPath = GUIDES_PAGE.path;

export const metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl.replace(/\/$/, '')}${canonicalPath}`,
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

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          ← Back to Home
        </Link>

        <p className="mt-8 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
          Free resources · Stratum IELTS
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white sm:text-4xl">
          IELTS Writing PDF Guides
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {GUIDES.length} original Stratum IELTS packs for Task 1 and Task 2 — structure, charts and
          maps, vocabulary, paraphrasing, overviews, common mistakes, study plans, idea banks, and
          score traps to avoid. Read each guide on this site, download a copy if you want, then run
          your draft through the AI Writing checker on stratumielts.com.
        </p>

        <GuidesPageClient />

        <section className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
          <h2 className="text-lg font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Next step
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Guides help you plan. The checker shows what an examiner would flag in your actual essay —
            grammar, cohesion, lexical range, and task response.
          </p>
          <Link
            href="/?app=1"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500"
          >
            Check your essay
          </Link>
        </section>
      </div>
    </div>
  );
}
