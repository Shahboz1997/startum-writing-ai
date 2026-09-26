import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { LEGAL_COMPANY_NAME } from '@/lib/support';

const baseUrl = getMetadataBaseUrl();

const META_TITLE = 'STRATUM — IELTS Writing Task 1 & Task 2 AI Examiner';
const META_DESCRIPTION =
  'Catches Task 1 data errors and scores Task 1 & Task 2 like an examiner in ~30 seconds. Free demo report, then sign in for full criteria, fixes, and rewrite. Practice estimates only.';

export const landingPageMetadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  keywords: [
    'IELTS writing checker',
    'IELTS Task 1',
    'IELTS Task 2',
    'AI IELTS examiner',
    'band score feedback',
    'GT letter IELTS',
    'academic writing IELTS',
    'STRATUM',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
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
  authors: [{ name: LEGAL_COMPANY_NAME, url: baseUrl }],
  robots: { index: true, follow: true },
};
