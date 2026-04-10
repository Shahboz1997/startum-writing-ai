'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const PHRASE_ORDER = ['introduction', 'overview', 'body', 'conclusion'];

/**
 * Full-screen modal: structure, cliché phrases, example
 */
export default function TemplateDetail({ template, darkMode, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!template) return null;

  const phrases = template.phrases || {};

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-template-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border max-w-2xl ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-4 border-b ${
            darkMode ? 'border-slate-800 bg-slate-900/95' : 'border-slate-100 bg-white/95'
          } backdrop-blur-md`}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-1">
              {template.type} · {template.subtype}
            </p>
            <h2 id="bank-template-title" className="text-lg font-extrabold tracking-tight pr-8">
              {template.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 p-2 rounded-xl border transition-colors ${
              darkMode
                ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Structure
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm font-medium leading-relaxed">
              {(template.structure || []).map((line, i) => (
                <li key={i} className="text-slate-700 dark:text-slate-200">
                  {line}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Phrases
            </h3>
            <div className="space-y-3">
              {PHRASE_ORDER.filter((k) => phrases[k]).map((k) => (
                <div
                  key={k}
                  className={`rounded-2xl p-4 border text-sm ${
                    darkMode ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                    {k}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{phrases[k]}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Example
            </h3>
            <p
              className={`text-sm leading-relaxed rounded-2xl p-4 border italic ${
                darkMode ? 'border-indigo-900/40 bg-indigo-950/20' : 'border-indigo-100 bg-indigo-50/50'
              }`}
            >
              {template.example}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
