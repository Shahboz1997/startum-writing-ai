'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
        <Loader2 className="relative w-10 h-10 text-indigo-500 dark:text-indigo-400 animate-spin" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-xs font-medium tracking-widest uppercase text-slate-500 dark:text-slate-400">
        Synchronizing Stratum Intelligence...
      </p>
    </div>
  );
}
