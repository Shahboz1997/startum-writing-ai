'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

function bankUrl(path) {
  const base = process.env.NEXT_PUBLIC_BANK_API_URL || '';
  return `${base}${path}`;
}

/**
 * Full topic card for /topics/:id — loads GET /api/bank/topic/:id (Next or Express via NEXT_PUBLIC_BANK_API_URL).
 */
export default function TopicDetails({ topicId, darkMode }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: d } = await axios.get(bankUrl(`/api/bank/topic/${topicId}`));
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setErr(
            e.response?.status === 404
              ? 'Topic not found.'
              : e.response?.data?.error || e.message || 'Failed to load topic'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const goBackToBank = () => {
    try {
      sessionStorage.setItem('stratum_nav_tab', 'Bank');
    } catch {
      /* ignore */
    }
    router.push('/?tab=Bank');
  };

  const panel = darkMode
    ? 'border-slate-800 bg-slate-900/50 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';

  return (
    <section className={`rounded-3xl border p-6 md:p-8 space-y-6 ${panel}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBackToBank}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold tracking-tight transition-colors border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bank
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16" aria-live="polite">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && err && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            darkMode ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {err}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="flex flex-wrap gap-2 items-start justify-between gap-y-3">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pr-4">
              {data.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-indigo-600 text-white">
                {data.taskType}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {data.subtype}
              </span>
              <span className="text-[10px] font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                Exam date: {data.examDate}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Prompt
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {data.promptText}
            </p>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {(data.keywords || []).map((k) => (
                <span
                  key={k}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
