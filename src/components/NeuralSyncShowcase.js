'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause } from 'lucide-react';
import {
  getWordTimings,
  resolveWordTimings,
} from '@/components/dashboard/SuggestedRewriteKaraoke';
import {
  buildSentenceRanges,
  findActiveSentenceIndexFromTimings,
} from '@/lib/karaokeWordAlign';
import {
  NEURAL_SYNC_SAMPLE_TEXT,
  NEURAL_SYNC_AUDIO_SRC,
  NEURAL_SYNC_TIMINGS_SRC,
} from '@/lib/neuralSyncSample';

/** idle | playing | paused | ended */
export default function NeuralSyncShowcase() {
  const [runState, setRunState] = useState('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const [bakedTimings, setBakedTimings] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState('');
  const activeSentenceRef = useRef(null);
  const audioRef = useRef(null);
  const didScrollAfterEndRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(NEURAL_SYNC_TIMINGS_SRC)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const words = Array.isArray(data.words) ? data.words : [];
        setBakedTimings(words);
        if (Number.isFinite(Number(data.duration)) && Number(data.duration) > 0) {
          setAudioDuration(Number(data.duration));
        }
      })
      .catch(() => {
        /* fallback: proportional timings from audio.duration */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const wordTimings = useMemo(() => {
    const resolved = resolveWordTimings({
      plainText: NEURAL_SYNC_SAMPLE_TEXT,
      wordTimestamps: bakedTimings || [],
      audioDuration: audioDuration > 0 ? audioDuration : undefined,
    });
    if (resolved.length > 0) return resolved;
    if (audioDuration > 0) return getWordTimings(NEURAL_SYNC_SAMPLE_TEXT, audioDuration);
    return getWordTimings(NEURAL_SYNC_SAMPLE_TEXT, 20);
  }, [bakedTimings, audioDuration]);

  const sentenceRanges = useMemo(() => buildSentenceRanges(wordTimings), [wordTimings]);

  const isPlaying = runState === 'playing';

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const syncFromAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const t = el.currentTime || 0;
    setCurrentTime(t);
    setActiveSentenceIndex(
      findActiveSentenceIndexFromTimings(wordTimings, t, undefined, sentenceRanges)
    );
  }, [wordTimings, sentenceRanges]);

  useEffect(() => {
    if (runState !== 'playing') {
      stopRaf();
      return;
    }
    const tick = () => {
      syncFromAudio();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return stopRaf;
  }, [runState, syncFromAudio, stopRaf]);

  const togglePlayPause = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;

    if (runState === 'playing') {
      el.pause();
      setRunState('paused');
      return;
    }

    setAudioError('');
    try {
      if (runState === 'ended' || runState === 'idle') {
        el.currentTime = 0;
        setCurrentTime(0);
        setActiveSentenceIndex(-1);
      }
      await el.play();
      setRunState('playing');
    } catch (e) {
      setAudioError(e?.message || 'Unable to play audio.');
      setRunState('idle');
    }
  }, [runState]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      setAudioReady(true);
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setAudioDuration(el.duration);
      }
    };
    const onPlay = () => setRunState('playing');
    const onPause = () => {
      if (!el.ended) setRunState((s) => (s === 'playing' ? 'paused' : s));
    };
    const onEnded = () => {
      setRunState('ended');
      setActiveSentenceIndex((idx) =>
        idx >= 0 ? idx : Math.max(0, sentenceRanges.length - 1)
      );
      setCurrentTime(el.duration || 0);
    };
    const onError = () => {
      setAudioError('Demo audio failed to load. Run npm run demo:neural-sync-audio.');
      setAudioReady(false);
    };

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('canplay', onLoaded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    if (el.readyState >= 1) onLoaded();

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('canplay', onLoaded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [wordTimings.length, sentenceRanges.length]);

  /** No per-sentence scroll while audio runs; one gentle scroll after the demo ends. */
  useEffect(() => {
    if (runState !== 'ended') {
      didScrollAfterEndRef.current = false;
      return;
    }
    if (didScrollAfterEndRef.current) return;
    didScrollAfterEndRef.current = true;
    const id = window.requestAnimationFrame(() => {
      activeSentenceRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [runState]);

  const statusLabel =
    audioError
      ? 'Audio unavailable'
      : runState === 'playing'
        ? 'Neural Voice Active'
        : runState === 'paused'
          ? 'Paused — tap play to resume'
          : runState === 'ended'
            ? 'Demo finished — tap to replay'
            : audioReady
              ? 'Preview Intelligence'
              : 'Loading audio…';

  return (
    <section
      id="neural-sync"
      aria-labelledby="neural-sync-heading"
      className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-slate-200/50 dark:border-white/5 overflow-hidden"
    >
      <audio ref={audioRef} preload="metadata" playsInline>
        <source src={NEURAL_SYNC_AUDIO_SRC} type="audio/mpeg" />
      </audio>
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-48px' }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            After the report
          </span>
          <h2
            id="neural-sync-heading"
            className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white"
          >
            Hear the model rewrite
          </h2>
          <p className="mt-3 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Optional synced audio for Writing model answers — press play and follow the highlighted sentence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-32px' }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.65 }}
          className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-start">
            <div className="flex sm:flex-col items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={Boolean(audioError)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none"
                aria-label={
                  isPlaying
                    ? 'Pause model rewrite audio'
                    : runState === 'paused'
                      ? 'Resume model rewrite audio'
                      : 'Play model rewrite audio'
                }
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 relative z-10" strokeWidth={1.75} fill="currentColor" />
                ) : (
                  <Play className="h-6 w-6 relative z-10 ml-0.5" strokeWidth={1.5} fill="currentColor" />
                )}
              </button>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center max-w-[8rem]">
                {isPlaying ? (
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Volume2 className="h-3 w-3 opacity-80" strokeWidth={1.5} aria-hidden />
                    {statusLabel}
                  </span>
                ) : (
                  statusLabel
                )}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  Example rewrite
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Illustrative sample — not a promised band
                </span>
              </div>
              <div className="max-h-[11rem] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-slate-900/40 custom-scrollbar">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  {sentenceRanges.map((range, si) => {
                    const active = si === activeSentenceIndex;
                    const played = activeSentenceIndex >= 0 && si < activeSentenceIndex;
                    const sentenceText = wordTimings
                      .slice(range.start, range.end)
                      .map((w) => w.word)
                      .join(' ');
                    return (
                      <span key={`sent-${si}`}>
                        <span
                          ref={active ? activeSentenceRef : undefined}
                          className={
                            active
                              ? 'rounded bg-indigo-600 px-0.5 text-white transition-colors duration-200'
                              : played
                                ? 'text-slate-800 dark:text-slate-400 transition-colors duration-300'
                                : 'text-slate-600 dark:text-slate-500 transition-colors duration-300'
                          }
                        >
                          {sentenceText}
                        </span>
                        {si < sentenceRanges.length - 1 ? ' ' : ''}
                      </span>
                    );
                  })}
                </p>
              </div>
              {audioError ? (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400" role="alert">
                  {audioError}
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
