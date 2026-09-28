'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import GuidePdfViewer from '@/components/guides/GuidePdfViewer';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

/**
 * Dedicated /guides/[slug] route — opens the same in-site viewer.
 */
export default function GuideSlugClient({ guide }) {
  const router = useRouter();
  const [downloadGuide, setDownloadGuide] = useState(null);

  const closeViewer = useCallback(() => {
    router.push('/?app=1#guides');
  }, [router]);

  const closeDownload = useCallback(() => setDownloadGuide(null), []);

  return (
    <>
      <GuidePdfViewer
        guide={guide}
        onClose={closeViewer}
        onDownload={() => setDownloadGuide(guide)}
        homeHref="/?app=1"
      />
      <GuideDownloadModal guide={downloadGuide} onClose={closeDownload} />
    </>
  );
}
