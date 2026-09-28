'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react';
import { guidePdfPath } from '@/lib/guides';

/**
 * Full-screen in-site PDF viewer.
 * Loads the PDF as a blob so X-Frame-Options: DENY on the static file
 * does not block the Chrome PDF plugin inside an iframe.
 *
 * @param {{ guide: object, onClose: () => void, onDownload: () => void, homeHref?: string }} props
 */
export default function GuidePdfViewer({ guide, onClose, onDownload, homeHref = '/?app=1#guides' }) {
  const titleId = useId();
  const pdfUrl = guidePdfPath(guide);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    let revoked = false;
    let objectUrl = null;
    const controller = new AbortController();

    setLoading(true);
    setLoadError('');
    setBlobUrl(null);

    (async () => {
      try {
        const res = await fetch(pdfUrl, { signal: controller.signal, cache: 'force-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const pdfBlob =
          blob.type === 'application/pdf' || blob.type === ''
            ? new Blob([blob], { type: 'application/pdf' })
            : blob;
        objectUrl = URL.createObjectURL(pdfBlob);
        if (revoked) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlobUrl(objectUrl);
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadError(err?.message || 'Could not load PDF');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      revoked = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-white dark:bg-slate-950"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Close viewer and go back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stratum IELTS · Free guide
            </p>
            <h2 id={titleId} className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              {guide.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download
          </button>
          <Link
            href={homeHref}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
          >
            Check your essay
          </Link>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-slate-100 dark:bg-slate-900">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
            <p className="text-sm font-medium">Loading PDF…</p>
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Could not embed this PDF in the viewer.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Open PDF in new tab
            </a>
          </div>
        ) : null}

        {blobUrl ? (
          <iframe
            title={`${guide.title} PDF`}
            src={blobUrl}
            className="absolute inset-0 h-full w-full border-0 bg-white dark:bg-slate-950"
          />
        ) : null}

        {!loading && !loadError ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:hidden">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-100"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Open PDF in browser
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
