'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, X } from 'lucide-react';
import { guidePdfPath } from '@/lib/guides';
import { trackGuideDownload } from '@/lib/analyticsEvents';

const EMAIL_STORAGE_KEY = 'stratum_guide_email';

export function triggerBrowserDownload(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function loadSavedGuideEmail() {
  try {
    return sessionStorage.getItem(EMAIL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGuideEmail(email) {
  try {
    sessionStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

/**
 * Email gate before PDF download (lead capture).
 * @param {{ guide: object | null, onClose: () => void, onDownloaded?: (info: { title: string, url: string }) => void }} props
 */
export default function GuideDownloadModal({ guide, onClose, onDownloaded }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const titleId = useId();
  const emailId = useId();

  useEffect(() => {
    setEmail(loadSavedGuideEmail());
  }, [guide?.slug]);

  useEffect(() => {
    if (!guide) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [guide, busy, onClose]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!guide || busy) return;
      setBusy(true);
      setError('');

      try {
        const res = await fetch('/api/guides/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, guideSlug: guide.slug }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Could not start download.');
          setBusy(false);
          return;
        }

        saveGuideEmail(email);
        const url = data.downloadUrl || guidePdfPath(guide);
        triggerBrowserDownload(url, data.fileName || guide.fileName);
        trackGuideDownload({ guideSlug: guide.slug });
        onDownloaded?.({ title: guide.title, url });
        onClose();
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [busy, email, guide, onClose, onDownloaded],
  );

  if (!guide) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">
              Get your free PDF
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Enter your email to download <span className="font-medium">{guide.title}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onClose();
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
            disabled={busy}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={busy}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-slate-500">
            We use your email to send writing tips from Stratum IELTS. See our{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Privacy Policy
            </Link>
            .
          </p>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            {busy ? 'Preparing…' : 'Download PDF'}
          </button>
        </form>
      </div>
    </div>
  );
}
