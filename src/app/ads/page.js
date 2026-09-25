import { Suspense } from 'react';
import AdsLandingClient from '@/components/landing/AdsLandingClient';
import { resolveLandingIntent } from '@/lib/landingMessageMatch';
import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const intent = resolveLandingIntent(sp);
  const base = getMetadataBaseUrl().replace(/\/+$/, '');
  return {
    title: `${intent.h1} | STRATUM`,
    description: intent.description,
    alternates: { canonical: `${base}/ads` },
    robots: { index: false, follow: true },
  };
}

/** Lightweight Google Ads landing — message match + guest preview, minimal JS below fold. */
export default function AdsLandingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-[100dvh] flex items-center justify-center bg-[#F9FAFB] dark:bg-[#050505]"
          aria-busy="true"
        >
          <p className="text-sm font-medium text-slate-500">STRATUM</p>
        </div>
      }
    >
      <AdsLandingClient />
    </Suspense>
  );
}
