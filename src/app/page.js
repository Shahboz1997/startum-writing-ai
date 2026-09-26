import { Suspense } from 'react';
import WriterShell from '@/components/writer/WriterShell';
import { landingPageMetadata } from '@/lib/landingMetadata';

export const metadata = landingPageMetadata;

export default async function HomePage({ searchParams }) {
  const sp = await searchParams;
  const landing = Array.isArray(sp?.landing) ? sp.landing[0] : sp?.landing;
  const app = Array.isArray(sp?.app) ? sp.app[0] : sp?.app;
  const forceLanding = landing === '1' || landing === 'true';
  const skipAppLanding = app === '1' || app === 'true';

  return (
    <Suspense fallback={null}>
      <WriterShell forceLanding={forceLanding} skipAppLanding={skipAppLanding} />
    </Suspense>
  );
}
