'use client';

import React from 'react';
import { ShieldAlert, Key } from 'lucide-react';

export default function ErrorState({ message, is401 = false, onDismiss, variant = 'default', className = '' }) {
  const Icon = is401 ? Key : ShieldAlert;
  /** Prefer explicit message (e.g. wrong password, API detail); fallback only when empty */
  const displayMessage =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : is401
        ? 'Access Denied. Check Stratum Credentials.'
        : 'Something went wrong.';

  if (variant === 'inline') {
    return (
      <div className={`rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 px-4 py-3 flex items-start justify-between gap-3 ${className}`}>
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Icon className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400 [filter:drop-shadow(0_0_6px_rgba(239,68,68,0.4))]" strokeWidth={1.5} />
          <span className="text-sm font-medium tracking-wide text-red-700 dark:text-red-300 break-words text-left">{displayMessage}</span>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0" aria-label="Dismiss">
            <span className="text-red-600 dark:text-red-400 text-xs font-medium">Dismiss</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-20 h-20 rounded-full bg-red-500/10 blur-2xl" aria-hidden />
        <Icon
          className="relative w-12 h-12 text-red-500 dark:text-red-400 [filter:drop-shadow(0_0_8px_rgba(239,68,68,0.4))]"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="text-sm font-medium tracking-wide text-red-600 dark:text-red-400 max-w-sm">
        {displayMessage}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
