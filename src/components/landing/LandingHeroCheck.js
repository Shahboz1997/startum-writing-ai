'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { clientApiUrl } from '@/lib/clientApiUrl';
import { GUEST_QUOTA_EXHAUSTED_CODE } from '@/lib/aiAccessShared';
import {
  GUEST_PREVIEW_MAX_WORDS,
  GUEST_PREVIEW_MIN_WORDS,
  countWords,
} from '@/lib/guestCheckPreview';
import { resolveLandingIntent } from '@/lib/landingMessageMatch';
import { LANDING_HERO_OFFER_LINE, saveLandingEssayPrefill } from '@/lib/landingHeroPrefill';

const PREVIEW_TIMEOUT_MS = 120_000;
/**
 * Shared hero: message-match H1 + essay paste + guest band preview (no signup).
 */
export default function LandingHeroCheck({
  onLoginClick,
  isLoggedIn = false,
  onContinueToLab,
  /** When true, skip framer wrappers — caller already styled the section. */
  compact = false,
}) {
  const searchParams = useSearchParams();
  const intent = useMemo(
    () => resolveLandingIntent(searchParams),
    [searchParams]
  );

  const [heroEssay, setHeroEssay] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const abortRef = useRef(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    setPreviewLoading(false);
  }, [intent.analysisMode]);

  const heroWordCount = useMemo(() => countWords(heroEssay), [heroEssay]);
  const softCap = GUEST_PREVIEW_MAX_WORDS;

  const openAuthForUpgrade = useCallback(() => {
    const isT1 = intent.analysisMode === 'task1';
    saveLandingEssayPrefill(isT1 ? '' : heroEssay, {
      openAuth: true,
      activeTab: isT1 ? 'Task 1' : 'Task 2',
      essayT1: isT1 ? heroEssay : undefined,
    });
    onLoginClick?.(
      'Your preliminary band is ready. Sign in with Google in 1 click to unlock the full error breakdown and recommendations.'
    );
  }, [onLoginClick, heroEssay, intent.analysisMode]);

  const runGuestPreview = useCallback(async () => {
    const text = heroEssay.trim();
    const words = countWords(text);
    if (words < GUEST_PREVIEW_MIN_WORDS) {
      setPreviewError(`Write at least ${GUEST_PREVIEW_MIN_WORDS} words before checking.`);
      return;
    }
    if (words > softCap) {
      setPreviewError(
        `Preview allows up to ${softCap} words. Shorten the excerpt, or sign in for a full essay.`
      );
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++requestSeqRef.current;
    const timeoutId = window.setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);

    try {
      const isT1 = intent.analysisMode === 'task1';
      const body = isT1
        ? {
            analysisMode: 'task1',
            essay1: text,
            promptText: 'IELTS Writing Task 1 practice (guest preview)',
            task1Kind: 'academic',
          }
        : {
            analysisMode: 'task2',
            essay2: text,
            promptText: 'IELTS Writing Task 2 practice (guest preview)',
          };

      const res = await fetch(clientApiUrl('/api/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));

      if (seq !== requestSeqRef.current) return;

      if (!res.ok) {
        if (data?.code === GUEST_QUOTA_EXHAUSTED_CODE) {
          setPreviewError(data.error || 'Free preview already used on this network.');
          openAuthForUpgrade();
          return;
        }
        setPreviewError(data?.error || 'Preview failed. Please try again.');
        return;
      }

      setPreview(data);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      if (err?.name === 'AbortError') {
        setPreviewError('Preview timed out. Check your connection and try again.');
        return;
      }
      setPreviewError('Network error. Please try again.');
    } finally {
      window.clearTimeout(timeoutId);
      if (seq === requestSeqRef.current) {
        setPreviewLoading(false);
      }
    }
  }, [heroEssay, intent.analysisMode, softCap, openAuthForUpgrade]);

  const startCheck = useCallback(() => {
    if (isLoggedIn) {
      const isT1 = intent.analysisMode === 'task1';
      saveLandingEssayPrefill(isT1 ? '' : heroEssay, {
        openAuth: false,
        activeTab: isT1 ? 'Task 1' : 'Task 2',
        essayT1: isT1 ? heroEssay : undefined,
      });
      if (typeof onContinueToLab === 'function') onContinueToLab();
      else if (typeof window !== 'undefined') window.location.href = '/?app=1';
      return;
    }
    void runGuestPreview();
  }, [isLoggedIn, heroEssay, intent.analysisMode, onContinueToLab, runGuestPreview]);

  const sectionClass = compact
    ? 'relative flex flex-col justify-center px-4 pt-10 pb-12'
    : 'relative flex flex-col justify-center bg-[#F9FAFB] dark:bg-[#050505] px-4 pt-10 pb-16 border-b border-slate-200/50 dark:border-white/5 overflow-hidden hero-noise';

  return (
    <section className={sectionClass}>
      {!compact && (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.12)_0%,transparent_50%)] pointer-events-none"
          aria-hidden
        />
      )}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <span className="tagline-pill mb-2 inline-block text-slate-500 dark:text-slate-400 font-medium tracking-wide">
          {intent.tagline}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
          {intent.h1}
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium tracking-wide max-w-2xl mx-auto mb-6 leading-relaxed">
          {intent.description}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-3">
          <button
            type="button"
            onClick={startCheck}
            disabled={previewLoading}
            data-testid="hero-check-free"
            className="btn-stratum inline-flex min-h-11 items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold disabled:opacity-60"
          >
            <div className="shimmer-layer animate-shimmer" aria-hidden />
            <span className="btn-stratum-text">
              {previewLoading
                ? 'Analyzing…'
                : isLoggedIn
                  ? intent.cta
                  : 'Check free'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onLoginClick?.()}
            data-testid="open-auth-login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Sign in
          </button>
        </div>
        <p className="mb-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          {LANDING_HERO_OFFER_LINE}
        </p>

        <div className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/20 p-4 sm:p-5 mt-2 text-left">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {intent.editorLabel}
            </span>
            <span
              className={`text-[10px] font-semibold tabular-nums ${
                heroWordCount > softCap
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {heroWordCount} / {softCap} words
            </span>
          </div>
          <label htmlFor="hero-essay-input" className="sr-only">
            Paste your IELTS essay excerpt
          </label>
          <textarea
            id="hero-essay-input"
            value={heroEssay}
            onChange={(e) => setHeroEssay(e.target.value)}
            rows={4}
            placeholder={intent.placeholder}
            disabled={previewLoading}
            className="w-full resize-y min-h-[5.5rem] rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 px-3 py-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-70"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              No email required for the preview band. Sign in only for the full report.
            </p>
            <button
              type="button"
              onClick={startCheck}
              disabled={previewLoading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-60"
            >
              {previewLoading
                ? 'Analyzing…'
                : isLoggedIn
                  ? intent.cta
                  : 'Check free'}
            </button>
          </div>

          {previewLoading && (
            <div
              className="mt-4 rounded-xl border border-indigo-200/60 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-500/10 px-4 py-5"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-indigo-500/30 border-t-indigo-600 animate-spin"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    Analyzing your writing…
                  </p>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Scoring Task Response, Cohesion, Lexis & Grammar
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2" aria-hidden>
                <div className="h-2 rounded-full bg-indigo-200/60 dark:bg-indigo-400/20 animate-pulse" />
                <div className="h-2 w-4/5 rounded-full bg-indigo-200/40 dark:bg-indigo-400/10 animate-pulse" />
                <div className="h-2 w-3/5 rounded-full bg-indigo-200/40 dark:bg-indigo-400/10 animate-pulse" />
              </div>
            </div>
          )}

          {previewError ? (
            <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400" role="alert">
              {previewError}
            </p>
          ) : null}

          {preview && !previewLoading ? (
            <div className="mt-4 rounded-xl border border-emerald-200/70 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10 p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80 mb-1">
                Preliminary band ready
              </p>
              <p className="text-3xl font-black tabular-nums text-emerald-900 dark:text-emerald-100">
                {preview.overall_band ?? '—'}
              </p>
              {preview.improvement_strategy ? (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {preview.improvement_strategy}
                </p>
              ) : null}
              {Array.isArray(preview.topIssues) && preview.topIssues.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-left">
                  {preview.topIssues.map((issue, i) => (
                    <li
                      key={`${issue.type}-${i}`}
                      className="text-xs text-slate-600 dark:text-slate-400"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {issue.type}:
                      </span>{' '}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 rounded-lg bg-white/80 dark:bg-black/20 border border-emerald-200/50 dark:border-emerald-500/20 px-3 py-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Your preliminary score is ready. Sign in with Google in 1 click to see the detailed
                  error breakdown and recommendations to raise your band.
                </p>
                <button
                  type="button"
                  onClick={openAuthForUpgrade}
                  className="mt-3 inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  Unlock full report · Google
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
