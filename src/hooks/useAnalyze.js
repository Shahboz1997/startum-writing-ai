'use client';

import { useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { postJson } from '@/lib/httpClient';
import { interpretAnalyzeFailure } from '@/lib/writer/interpretAnalyzeFailure';
import { AUTH_REQUIRED_CODE } from '@/lib/aiAccessShared';
import { CREDITS_EXHAUSTED_CODE } from '@/lib/credits';
import { getEssayWordCount } from '@/lib/writer/editorUi';
import { trackFirstCheck, trackEvent } from '@/lib/analyticsEvents';
import {
  markFirstCheckDone,
  markStudyPlanNudgeShown,
  shouldShowStudyPlanNudge,
} from '@/lib/firstRunOnboarding';
import { markActivatedAt } from '@/lib/retentionEvents';

const ANALYZE_TIMEOUT_MS = 120_000;

function showStudyPlanNudgeToast() {
  if (!shouldShowStudyPlanNudge()) return;
  markStudyPlanNudgeShown();
  trackEvent('study_plan_nudge_shown', { source: 'first_check' });
  toast(
    (t) => (
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
        First check saved.{' '}
        <a
          href="/study-plan"
          className="font-bold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          onClick={() => {
            trackEvent('study_plan_click', { source: 'first_check_nudge' });
            toast.dismiss(t.id);
          }}
        >
          Open Study plan
        </a>{' '}
        to track weak areas — or turn on reminders in Settings.
      </span>
    ),
    { duration: 9000, id: 'study-plan-nudge' }
  );
}

async function pullCreditsBalance(setCredits) {
  try {
    const res = await fetch('/api/user/credits', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data?.credits === 'number') setCredits(data.credits);
  } catch (_) {
    /* ignore */
  }
}

/**
 * Essay analysis against POST /api/check (auth + credits enforced server-side).
 */
export function useAnalyze({
  session,
  sessionStatus,
  credits,
  essayT1,
  essayT2,
  promptT1Academic,
  promptT1Letter,
  promptT2,
  task1Kind,
  letterMeta,
  image,
  setResultT1,
  setResultT2,
  setLoadingT1,
  setLoadingT2,
  setError,
  setErrorIs401,
  setIsAuthOpen,
  setAuthModalMessage,
  setCredits,
  scrollToScoreAfterAnalyzeRef,
  playSuccessSound,
  onCreditsExhausted,
}) {
  const analyzeInFlightRef = useRef(false);
  const abortRef = useRef(null);
  const requestSeqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const handleAnalyze = useCallback(
    async (mode, overrides = {}) => {
      if (sessionStatus !== 'authenticated' || !session?.user) {
        setAuthModalMessage('Sign in to analyze your essay.');
        setIsAuthOpen(true);
        return;
      }
      if (credits <= 0) {
        if (typeof onCreditsExhausted === 'function') onCreditsExhausted();
        else {
          toast.error(
            'You have no credits left. Contact support via the site footer to request more.',
            { duration: 5000 }
          );
        }
        return;
      }

      const essayT1Effective =
        typeof overrides.essayT1 === 'string' ? overrides.essayT1 : essayT1;
      const essayT2Effective =
        typeof overrides.essayT2 === 'string' ? overrides.essayT2 : essayT2;
      const promptT2Effective =
        typeof overrides.promptT2 === 'string' ? overrides.promptT2 : promptT2;
      const essayText = mode === 'task1' ? essayT1Effective : essayT2Effective;
      if (getEssayWordCount(essayText) < 10) {
        toast.error('Write at least 10 words before analyzing.', { duration: 4000 });
        return;
      }

      if (analyzeInFlightRef.current) return;
      analyzeInFlightRef.current = true;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = ++requestSeqRef.current;

      const setCurLoading = mode === 'task1' ? setLoadingT1 : setLoadingT2;
      setCurLoading(true);
      setError(null);
      setErrorIs401(false);

      const timeoutId = window.setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
      const analyzeSource =
        typeof overrides.source === 'string' && overrides.source
          ? overrides.source
          : 'writer';

      try {
        const payload = {
          analysisMode: mode,
          essay1: essayT1Effective,
          essay2: essayT2Effective,
          promptText:
            mode === 'task1'
              ? task1Kind === 'gt_letter'
                ? promptT1Letter
                : promptT1Academic
              : promptT2Effective,
          image: mode === 'task1' && task1Kind === 'academic' ? image : null,
          task1Kind: mode === 'task1' ? task1Kind : undefined,
          letterMeta: mode === 'task1' && task1Kind === 'gt_letter' ? letterMeta : undefined,
        };

        const data = await postJson('/api/check', payload, { signal: controller.signal });

        if (!mountedRef.current || seq !== requestSeqRef.current) return;

        const { savedId, ...analysisRest } = data || {};
        const resultPayload = {
          ...analysisRest,
          savedId: savedId || null,
          text: mode === 'task1' ? essayT1Effective : essayT2Effective,
        };
        if (mode === 'task1') setResultT1(resultPayload);
        else setResultT2(resultPayload);

        const isFirstCheck = markFirstCheckDone();
        if (isFirstCheck) {
          markActivatedAt();
          const band =
            analysisRest?.overall_band ??
            analysisRest?.overallBand ??
            analysisRest?.score ??
            null;
          trackFirstCheck({
            analysisMode: mode,
            source: analyzeSource,
            overallBand: band,
          });
          showStudyPlanNudgeToast();
        } else if (savedId) {
          toast.success('Saved to your history.', { duration: 3500 });
        }

        if (typeof data?.creditsRemaining === 'number') {
          setCredits(data.creditsRemaining);
        } else {
          await pullCreditsBalance(setCredits);
        }
        if (typeof playSuccessSound === 'function') playSuccessSound();
        scrollToScoreAfterAnalyzeRef.current = true;
      } catch (err) {
        if (!mountedRef.current || seq !== requestSeqRef.current) return;

        const aborted = err?.name === 'AbortError';
        const { status, dataError, message: baseMsg, apiCode } = interpretAnalyzeFailure(err);
        let msg = aborted
          ? 'Analysis timed out. Check your connection and try again.'
          : baseMsg;

        const isApiKeyError =
          apiCode === 'INVALID_API_KEY' ||
          apiCode === 'MISSING_API_KEY' ||
          apiCode === 'MISSING_PROJECT_ID' ||
          dataError === 'INVALID_API_KEY';

        if (process.env.NODE_ENV === 'development' && !isApiKeyError) {
          console.warn('Analysis failed:', status ?? 'no-status', dataError || baseMsg);
        }

        if (apiCode === AUTH_REQUIRED_CODE) {
          setAuthModalMessage(msg);
          setIsAuthOpen(true);
        }

        if (status === 401) {
          if (isApiKeyError) {
            msg =
              typeof dataError === 'string' && dataError && dataError !== 'INVALID_API_KEY'
                ? dataError
                : 'Check API Key. Add a valid OPENAI_API_KEY to .env.local and restart npm run dev.';
          } else {
            setErrorIs401(true);
            msg = 'Please sign in to ANALYZE STRATUM DATA.';
          }
        } else if (status === 403) {
          msg =
            typeof dataError === 'string' && dataError
              ? dataError
              : 'You have no credits left. Choose a pack to top up — pay by Visa, then tap “I paid” in the packages dialog.';
          if (apiCode === CREDITS_EXHAUSTED_CODE) {
            setCredits(0);
            if (typeof onCreditsExhausted === 'function') onCreditsExhausted();
            setError(null);
            return;
          }
          await pullCreditsBalance(setCredits);
        } else if (status === 503 || status === 502 || status === 500) {
          msg =
            typeof dataError === 'string' && dataError
              ? dataError
              : status === 503
                ? 'Service temporarily unavailable. Please try again shortly.'
                : status === 502
                  ? 'The analysis service returned an invalid response. Please try again.'
                  : 'Server error while analyzing. Please try again in a moment.';
        }

        setError(msg);
        toast.error(msg);
      } finally {
        window.clearTimeout(timeoutId);
        if (seq === requestSeqRef.current) {
          setCurLoading(false);
          analyzeInFlightRef.current = false;
        }
      }
    },
    [
      session,
      sessionStatus,
      credits,
      essayT1,
      essayT2,
      promptT1Academic,
      promptT1Letter,
      promptT2,
      task1Kind,
      letterMeta,
      image,
      setResultT1,
      setResultT2,
      setLoadingT1,
      setLoadingT2,
      setError,
      setErrorIs401,
      setIsAuthOpen,
      setAuthModalMessage,
      setCredits,
      scrollToScoreAfterAnalyzeRef,
      playSuccessSound,
      onCreditsExhausted,
    ]
  );

  return { handleAnalyze };
}
