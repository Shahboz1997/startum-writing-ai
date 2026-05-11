import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';

/** Public indexable routes — dashboard/auth/share omitted. */
const PATHS = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/landing', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.4 },
];

export default function sitemap() {
  const base = getMetadataBaseUrl().replace(/\/$/, '');
  const lastModified = new Date();
  return PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === '/' ? '/' : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
