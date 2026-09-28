'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { guidePdfPath } from '@/lib/guides';

/**
 * True when the environment cannot reliably render a PDF inside an iframe
 * (iOS Safari, Telegram/WKWebView, many Android in-app browsers).
 */
function detectInlinePdfUnsupported() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInApp =
    /\b(FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|TikTok|BytedanceWebview|Snapchat|Discord|Telegram)\b/i.test(
      ua,
    );
  const isAndroidWebView =
    /Android/i.test(ua) &&
    (/\bwv\b|; wv\)/i.test(ua) || (!/Chrome\/\d+/i.test(ua) && /Version\/\d/i.test(ua)));
  // Phone-sized touch UIs (incl. many in-app browsers that hide their UA brand)
  const isPhoneTouch =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches;
  return isIos || isInApp || isAndroidWebView || isPhoneTouch;
}

/**
 * Full-screen in-site PDF viewer.
 * Desktop: embeds /guides/*.pdf in an iframe (X-Frame-Options is SAMEORIGIN for those paths).
 * Mobile / in-app browsers: no PDF-in-iframe support — show an explicit open action instead.
 *
 * @param {{ guide: object, onClose: () => void, onDownload: () => void, homeHref?: string }} props
 */
export default function GuidePdfViewer({ guide, onClose, onDownload, homeHref = '/?app=1#guides' }) {
  const titleId = useId();
  const pdfUrl = guidePdfPath(guide);
  const [useExternalOpen, setUseExternalOpen] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    setUseExternalOpen(detectInlinePdfUnsupported());
  }, []);

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
    if (useExternalOpen) {
      setIframeReady(true);
      return undefined;
    }
    setIframeReady(false);
    const t = window.setTimeout(() => setIframeReady(true), 120);
    return () => window.clearTimeout(t);
  }, [useExternalOpen, pdfUrl]);

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
        {useExternalOpen ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"
              aria-hidden
            >
              <FileText className="h-8 w-8" />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="text-base font-bold text-slate-900 dark:text-white">{guide.title}</p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                This browser cannot show PDFs inside the app. Open the file to read it, or download a copy.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2.5">
              <a
                href={pdfUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-500"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open PDF
              </a>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <Download className="h-4 w-4" aria-hidden />
                Download PDF
              </button>
            </div>
          </div>
        ) : (
          <>
            {!iframeReady ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
                <p className="text-sm font-medium">Loading PDF…</p>
              </div>
            ) : null}
            {iframeReady ? (
              <iframe
                title={`${guide.title} PDF`}
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="absolute inset-0 h-full w-full border-0 bg-white dark:bg-slate-950"
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
