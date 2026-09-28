import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { listDemoReports } from '@/lib/demoReports';
import { SEO_TOPIC_PAGES } from '@/lib/seoTopicPages';
import { GUIDES } from '@/lib/guides';

/** Public indexable routes — dashboard/auth/private share omitted. */
const PATHS = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/landing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/guides', changeFrequency: 'monthly', priority: 0.85 },
  { path: SEO_TOPIC_PAGES.task2Checker.path, changeFrequency: 'monthly', priority: 0.85 },
  { path: SEO_TOPIC_PAGES.task1Academic.path, changeFrequency: 'monthly', priority: 0.85 },
  { path: SEO_TOPIC_PAGES.gtLetter.path, changeFrequency: 'monthly', priority: 0.85 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/data-deletion', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.4 },
];

export default function sitemap() {
  const base = getMetadataBaseUrl().replace(/\/$/, '');
  const lastModified = new Date();
  const staticUrls = PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === '/' ? '/' : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const guideUrls = GUIDES.map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const demoUrls = listDemoReports().map((d) => ({
    url: `${base}${d.href}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: d.flagship ? 0.85 : 0.7,
  }));

  return [...staticUrls, ...guideUrls, ...demoUrls];
}
