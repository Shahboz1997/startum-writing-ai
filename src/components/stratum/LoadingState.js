'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ className = '' }) {
  const messages = React.useMemo(
    () => [
      'Synchronizing Stratum Intelligence',
      'Aligning your study signals',
      'Generating smart feedback',
      'Polishing the final output',
    ],
    [],
  );

  const [messageIdx, setMessageIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(8);

  React.useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIdx((i) => (i + 1) % messages.length);
    }, 1600);

    const progTimer = setInterval(() => {
      setProgress((p) => {
        // Eases into ~92% to avoid “lying” about completion.
        const cap = 92;
        const remaining = cap - p;
        if (remaining <= 0.25) return cap;
        const step = Math.max(0.35, remaining * 0.06);
        return Math.min(cap, p + step);
      });
    }, 180);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progTimer);
    };
  }, [messages.length]);

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient glow */}
        <div
          className="absolute h-28 w-28 rounded-full bg-indigo-500/20 blur-3xl animate-pulse motion-reduce:animate-none"
          aria-hidden
        />

        {/* Gradient ring */}
        <div
          className="absolute h-16 w-16 rounded-full animate-spin motion-reduce:animate-none"
          aria-hidden
          style={{
            background:
              'conic-gradient(from 180deg, rgba(99,102,241,0.0), rgba(99,102,241,0.85), rgba(99,102,241,0.0))',
            WebkitMask: 'radial-gradient(farthest-side, transparent 62%, #000 63%)',
            mask: 'radial-gradient(farthest-side, transparent 62%, #000 63%)',
          }}
        />

        {/* Core spinner */}
        <div className="relative grid place-items-center">
          <Loader2
            className="w-9 h-9 text-indigo-600 dark:text-indigo-400 animate-spin motion-reduce:animate-none"
            strokeWidth={1.6}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <p
          className="text-xs font-medium tracking-widest uppercase text-slate-500 dark:text-slate-400"
          aria-live="polite"
        >
          <span key={messageIdx} className="inline-block animate-pulse motion-reduce:animate-none">
            {messages[messageIdx]}
          </span>
        </p>
        <span className="inline-flex items-end gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500/80 animate-bounce motion-reduce:animate-none [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500/80 animate-bounce motion-reduce:animate-none [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500/80 animate-bounce motion-reduce:animate-none" />
        </span>
      </div>

      {/* Progress + shimmer */}
      <div className="mt-4 w-64 max-w-[70vw]">
        <div className="h-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500/50 via-indigo-500/80 to-indigo-400/70 transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200/40 dark:bg-slate-800/40">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
