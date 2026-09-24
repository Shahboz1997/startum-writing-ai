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

const VISUALIZER_BARS = 24;

/** idle | playing | paused | ended */
export default function NeuralSyncShowcase({ onCtaClick }) {
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
      className="py-14 sm:py-20 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5 overflow-hidden"
    >
      <audio ref={audioRef} preload="metadata" playsInline>
        <source src={NEURAL_SYNC_AUDIO_SRC} type="audio/mpeg" />
      </audio>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-48px' }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Neural Sync
          </span>
          <h2 id="neural-sync-heading" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-3">
            THE SOUND OF PERFECTION
          </h2>
          <p className="text-lg sm:text-xl font-semibold tracking-tight text-slate-700 dark:text-slate-300 mb-2">
            READ. LISTEN. EVOLVE.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
            Experience our Neural Shadowing technology. Every model answer comes with a synced audio strata to master your rhythm and pronunciation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-32px' }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
          className="rounded-[2rem] border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-2xl shadow-2xl shadow-black/5 dark:shadow-black/20 p-6 sm:p-8 md:p-10"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center">
            {/* Left: Play / Pause + Visualizer */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 shrink-0">
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={Boolean(audioError)}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(79,70,229,0.5)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none"
                aria-label={
                  isPlaying ? 'Pause Neural Sync demo' : runState === 'paused' ? 'Resume Neural Sync demo' : 'Play Neural Sync demo'
                }
              >
                {!isPlaying && !audioError && (
                  <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping opacity-30" aria-hidden />
                )}
                {isPlaying ? (
                  <Pause className="w-10 h-10 sm:w-12 sm:h-12 relative z-10" strokeWidth={1.75} fill="currentColor" />
                ) : (
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 relative z-10 ml-1" strokeWidth={1.5} fill="currentColor" />
                )}
              </button>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center max-w-[14rem]">
                {isPlaying ? (
                  <span className="inline-flex items-center gap-1.5 justify-center">
                    <Volume2 className="w-3.5 h-3.5 opacity-80" strokeWidth={1.5} />
                    {statusLabel}
                  </span>
                ) : (
                  statusLabel
                )}
              </p>
              {audioError ? (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 text-center max-w-[16rem]">{audioError}</p>
              ) : null}

              {/* Visualizer: moving bars */}
              <div className="flex items-end justify-center gap-1 h-12" aria-hidden>
                {Array.from({ length: VISUALIZER_BARS }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 sm:w-2 rounded-full bg-indigo-500/80 dark:bg-indigo-400/80"
                    animate={
                      isPlaying
                        ? {
                            height: ['20%', '90%', '40%', '70%', '30%', '85%', '20%'],
                            transition: {
                              duration: 0.8 + (i % 5) * 0.15,
                              repeat: Infinity,
                              delay: i * 0.04,
                            },
                          }
                        : { height: '28%' }
                    }
                    style={{ minHeight: 6 }}
                  />
                ))}
              </div>
            </div>

            {/* Right: Glassmorphism text block — Band 9 sample + sentence highlight */}
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 dark:border-white/10 p-5 sm:p-6 max-h-[280px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    Band 9.0 Sample
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-600 text-sm sm:text-base leading-relaxed font-medium tracking-wide">
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
                              ? 'text-white bg-indigo-600/90 rounded-md px-1 py-0.5 shadow-[0_0_20px_rgba(79,70,229,0.45)] transition-all duration-200'
                              : played
                                ? 'text-slate-800 dark:text-slate-400 transition-colors duration-300'
                                : 'text-slate-700 dark:text-slate-600 transition-colors duration-300'
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
            </div>
          </div>

          {/* CTA: Shimmer button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <button
              type="button"
              onClick={onCtaClick}
              className="btn-stratum relative overflow-hidden inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-[0.2em] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-shadow"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">ANALYZE MY ESSAY NOW</span>
            </button>
          </motion.div>

          {/* Social proof */}
          <p className="mt-6 text-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto px-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 backdrop-blur-sm">
            94% of users improved their listening &amp; speaking scores using Stratum Shadowing.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
