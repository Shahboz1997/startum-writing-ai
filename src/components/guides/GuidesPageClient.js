'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import GuidesGrid from '@/components/guides/GuidesGrid';
import GuidePdfViewer from '@/components/guides/GuidePdfViewer';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

export default function GuidesPageClient() {
  const [viewerGuide, setViewerGuide] = useState(null);
  const [downloadGuide, setDownloadGuide] = useState(null);
  const [done, setDone] = useState(null);

  const closeViewer = useCallback(() => setViewerGuide(null), []);
  const closeDownload = useCallback(() => setDownloadGuide(null), []);

  return (
    <>
      <GuidesGrid
        className="mt-10"
        onOpen={setViewerGuide}
        onDownload={setDownloadGuide}
      />

      {done ? (
        <div
          className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/30"
          role="status"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Download started: {done.title}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            If the file did not open,{' '}
            <a
              href={done.url}
              download
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              tap here to save the PDF
            </a>
            .
          </p>
          <Link
            href="/?app=1"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"
          >
            Check your essay
          </Link>
        </div>
      ) : null}

      {viewerGuide ? (
        <GuidePdfViewer
          guide={viewerGuide}
          onClose={closeViewer}
          onDownload={() => setDownloadGuide(viewerGuide)}
          homeHref="/?app=1"
        />
      ) : null}

      <GuideDownloadModal
        guide={downloadGuide}
        onClose={closeDownload}
        onDownloaded={setDone}
      />
    </>
  );
}
