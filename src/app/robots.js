import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';

export default function robots() {
  const base = getMetadataBaseUrl().replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/history', '/settings', '/study-plan', '/dashboard', '/share/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
