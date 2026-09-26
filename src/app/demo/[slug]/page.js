export const revalidate = 3600;

import { notFound } from 'next/navigation';
import { getDemoMeta, loadDemoReport, listDemoReports } from '@/lib/demoReports';
import { resolvePublicSiteOrigin } from '@/lib/publicSiteUrl';
import SharedReportDocument from '@/components/share/SharedReportDocument';

export function generateStaticParams() {
  return listDemoReports().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }) {
  const p = await params;
  const meta = getDemoMeta(p?.slug);
  if (!meta) {
    return { title: 'Sample report — STRATUM', robots: { index: true, follow: true } };
  }
  const title = `${meta.title} — sample IELTS Writing report | STRATUM`;
  const description = `${meta.blurb} Practice estimate only — not an official IELTS score. Free demo → sign in → buy USD credits.`;
  const path = `/demo/${meta.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      images: ['/og-image.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  };
}

export default async function DemoReportPage({ params }) {
  const p = await params;
  const slug = String(p?.slug || '');
  const meta = getDemoMeta(slug);
  const report = loadDemoReport(slug);
  if (!meta || !report) notFound();

  const publicBase = resolvePublicSiteOrigin();
  const landingHref = publicBase
    ? `${publicBase}/?landing=1&utm_source=demo&utm_content=${encodeURIComponent(slug)}#hero-check`
    : `/?landing=1&utm_source=demo&utm_content=${encodeURIComponent(slug)}#hero-check`;

  return (
    <SharedReportDocument
      tasks={report.tasks}
      refLabel={report.ref || 'stratum-demo'}
      heading="Sample IELTS Writing Analysis"
      intro="Real examiner pipeline — criteria, corrections, lexical upgrade, and draft vs rewrite. Practice estimate only — not an official IELTS score. Free demo → Sign in → Buy credits."
      landingHref={landingHref}
      badge="Evergreen demo · not a time-limited share link"
    />
  );
}
