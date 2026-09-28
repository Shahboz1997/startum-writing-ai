import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { GUIDES, getGuideBySlug, guidePdfPath } from '@/lib/guides';
import GuideSlugClient from '@/components/guides/GuideSlugClient';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide not found' };

  const baseUrl = getMetadataBaseUrl();
  const path = `/guides/${guide.slug}`;
  const title = `${guide.title} · Free IELTS PDF`;
  const description = guide.description;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${baseUrl.replace(/\/$/, '')}${path}`,
      siteName: 'STRATUM',
      title,
      description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'STRATUM IELTS Writing' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    robots: { index: true, follow: true },
  };
}

export default async function GuideSlugPage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-slate-950">
      <GuideSlugClient guide={guide} />
      <noscript>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Link href="/guides" className="text-indigo-600">
            ← All guides
          </Link>
          <h1 className="mt-6 text-2xl font-bold">{guide.title}</h1>
          <p className="mt-2 text-slate-600">{guide.description}</p>
          <a href={guidePdfPath(guide)} className="mt-4 inline-block text-indigo-600 underline">
            Open PDF
          </a>
        </div>
      </noscript>
    </div>
  );
}
