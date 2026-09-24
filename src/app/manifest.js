import { LEGAL_COMPANY_NAME } from '@/lib/support';

/** @type {import('next').MetadataRoute.Manifest} */
export default function manifest() {
  return {
    name: `STRATUM — ${LEGAL_COMPANY_NAME}`,
    short_name: 'STRATUM',
    description:
      'Elevate your IELTS score with Stratum. Precision AI-driven evaluation for Task 1 and Task 2.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#6366f1',
    background_color: '#050505',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
