'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export default function LegalPageLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505]">
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        transition={pageTransition.transition}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-2">Last updated: {lastUpdated}</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-12">
          {title}
        </h1>
        <article className="max-w-none font-[var(--font-geist-sans)] text-slate-700 dark:text-slate-300 leading-relaxed space-y-10 [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-tighter [&_h2]:uppercase [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mt-12 [&_h2]:mb-4 [&_p]:mb-4 [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:hover:underline">
          {children}
        </article>
      </motion.div>
    </div>
  );
}
