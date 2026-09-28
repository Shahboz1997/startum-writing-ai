'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GuidesGrid from '@/components/guides/GuidesGrid';
import GuidePdfViewer from '@/components/guides/GuidePdfViewer';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

/**
 * Free Guides block for HOME — sits below task labs (secondary to evaluation path).
 */
export default function HomeGuidesSection() {
  const [viewerGuide, setViewerGuide] = useState(null);
  const [downloadGuide, setDownloadGuide] = useState(null);

  const closeViewer = useCallback(() => setViewerGuide(null), []);
  const closeDownload = useCallback(() => setDownloadGuide(null), []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.location.hash !== '#guides') return undefined;
    const t = window.setTimeout(() => {
      document.getElementById('guides')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <motion.section
        id="guides"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="scroll-mt-24 space-y-3 sm:space-y-5 border-t border-slate-200/80 dark:border-slate-800 pt-7 sm:pt-10 md:pt-12"
        aria-labelledby="home-guides-heading"
      >
        <div className="text-left">
          <h2
            id="home-guides-heading"
            className="text-base sm:text-xl md:text-2xl font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white"
          >
            <span className="w-1.5 h-4 sm:h-5 md:h-6 bg-indigo-600 dark:bg-indigo-500 rounded-full" aria-hidden />
            Free Guides
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 max-w-2xl">
            Open a pack on site, or download a PDF copy.
          </p>
        </div>

        <GuidesGrid
          className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
          onOpen={setViewerGuide}
          onDownload={setDownloadGuide}
        />
      </motion.section>

      {viewerGuide ? (
        <GuidePdfViewer
          guide={viewerGuide}
          onClose={closeViewer}
          onDownload={() => setDownloadGuide(viewerGuide)}
          homeHref="/?app=1"
        />
      ) : null}

      <GuideDownloadModal guide={downloadGuide} onClose={closeDownload} />
    </>
  );
}
