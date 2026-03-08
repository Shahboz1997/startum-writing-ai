'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessState({ message = 'Complete.', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 dark:bg-indigo-500/20 blur-2xl animate-pulse" aria-hidden />
        <CheckCircle2
          className="relative w-12 h-12 text-emerald-500 dark:text-indigo-400 animate-pulse [filter:drop-shadow(0_0_8px_rgba(16,185,129,0.4))] dark:[filter:drop-shadow(0_0_8px_rgba(99,102,241,0.4))]"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <p className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
        {message}
      </p>
    </div>
  );
}
