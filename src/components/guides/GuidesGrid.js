'use client';

import { BookOpen, FileText } from 'lucide-react';
import { GUIDES } from '@/lib/guides';

/**
 * Shared guide cards — Open reads on site; optional Download triggers email gate.
 * @param {{ onOpen: (guide: object) => void, onDownload?: (guide: object) => void, className?: string }} props
 */
export default function GuidesGrid({ onOpen, onDownload, className = '' }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`.trim()}>
      {GUIDES.map((guide) => (
        <li
          key={guide.slug}
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {guide.topics.map((topic) => (
              <span
                key={topic}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {topic}
              </span>
            ))}
          </div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {guide.title}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {guide.description}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpen(guide)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              aria-label={`Read ${guide.title} on site`}
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              Read on site
            </button>
            {onDownload ? (
              <button
                type="button"
                onClick={() => onDownload(guide)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label={`Download ${guide.title} PDF`}
              >
                Download PDF
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
