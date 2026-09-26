import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import {
  LEGAL_COMPANY_NAME,
  SUPPORT_EMAIL,
  TELEGRAM_CHANNEL_URL,
  FACEBOOK_PAGE_URL,
  INSTAGRAM_PAGE_URL,
} from '@/lib/support';
import { LANDING_FAQ_ITEMS, LANDING_HERO } from '@/lib/landingSeoData';

export default function LandingJsonLd() {
  const base = getMetadataBaseUrl().replace(/\/$/, '');

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'STRATUM',
    url: base,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: LANDING_HERO.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'One demo check; full analysis with account credits (USD packs)',
    },
    publisher: {
      '@type': 'Organization',
      name: LEGAL_COMPANY_NAME,
      url: base,
      email: SUPPORT_EMAIL,
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${base}/#faq`,
    url: base,
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: LEGAL_COMPANY_NAME,
    url: base,
    logo: `${base}/favicon.png`,
    sameAs: [TELEGRAM_CHANNEL_URL, FACEBOOK_PAGE_URL, INSTAGRAM_PAGE_URL].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
