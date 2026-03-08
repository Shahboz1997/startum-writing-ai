'use client';

import React from 'react';
import { FolderSearch } from 'lucide-react';

export default function EmptyState({ message = 'No data strata found.', onPrimaryAction, primaryLabel = 'Generate First Task', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <FolderSearch
        className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"
        strokeWidth={1}
        aria-hidden
      />
      <p className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 mb-6">
        {message}
      </p>
      {onPrimaryAction && (
        <button
          type="button"
          onClick={onPrimaryAction}
          className="btn-stratum px-6 py-3 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
        >
          <div className="shimmer-layer animate-shimmer" aria-hidden />
          <span className="btn-stratum-text">{primaryLabel}</span>
        </button>
      )}
    </div>
  );
}
