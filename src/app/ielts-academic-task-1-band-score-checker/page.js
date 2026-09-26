import SeoTopicLanding from '@/components/landing/SeoTopicLanding';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { SEO_TOPIC_PAGES } from '@/lib/seoTopicPages';

const page = SEO_TOPIC_PAGES.task1Academic;
const baseUrl = getMetadataBaseUrl();

export const metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: page.path },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl.replace(/\/$/, '')}${page.path}`,
    siteName: 'STRATUM',
    title: page.title,
    description: page.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'STRATUM IELTS Writing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.title,
    description: page.description,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function AcademicTask1CheckerPage() {
  return (
    <SeoTopicLanding
      h1={page.h1}
      lead={page.lead}
      benefits={page.benefits}
      faq={page.faq}
      demoHref={page.demoHref}
      secondaryHref={page.secondaryHref}
      secondaryLabel={page.secondaryLabel}
    />
  );
}
