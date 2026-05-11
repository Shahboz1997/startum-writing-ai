'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause } from 'lucide-react';
import { getWordTimings } from '@/components/dashboard/SuggestedRewriteKaraoke';

const DEMO_DURATION = 30;
const BAND_9_SAMPLE =
  'The graph illustrates significant shifts in cinema attendance between 1990 and 2010. Overall, attendance rose substantially over the period, with a particularly sharp increase in the final decade. These trends suggest a growing preference for theatrical viewing despite the rise of streaming platforms.';

const VISUALIZER_BARS = 24;

/** idle | playing | paused | ended */
export default function NeuralSyncShowcase({ onCtaClick }) {
  const [runState, setRunState] = useState('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const activeWordRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const didScrollAfterEndRef = useRef(false);

  const wordTimings = useMemo(() => getWordTimings(BAND_9_SAMPLE, DEMO_DURATION), []);

  const isPlaying = runState === 'playing';

  const togglePlayPause = useCallback(() => {
    if (runState === 'playing') {
      setRunState('paused');
      return;
    }
    if (runState === 'paused') {
      lastFrameRef.current = null;
      setRunState('playing');
      return;
    }
    if (runState === 'idle' || runState === 'ended') {
      setCurrentTime(0);
      setActiveWordIndex(-1);
      lastFrameRef.current = null;
      setRunState('playing');
    }
  }, [runState]);

  useEffect(() => {
    if (runState !== 'playing') return;

    const tick = (t) => {
      const last = lastFrameRef.current ?? t;
      lastFrameRef.current = t;
      const dt = Math.min(0.12, Math.max(0, (t - last) / 1000));

      setCurrentTime((ct) => {
        const next = Math.min(DEMO_DURATION, ct + dt);
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [runState]);

  useEffect(() => {
    if (runState !== 'playing') return;
    if (currentTime >= DEMO_DURATION) {
      setRunState('ended');
      setActiveWordIndex(wordTimings.length - 1);
      setCurrentTime(DEMO_DURATION);
    }
  }, [currentTime, runState, wordTimings.length]);

  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < wordTimings.length; i++) {
      const w = wordTimings[i];
      if (currentTime >= w.start && currentTime < w.end + 0.05) {
        idx = i;
        break;
      }
    }
    setActiveWordIndex(idx);
  }, [currentTime, wordTimings]);

  /** No per-word scroll while audio runs; one gentle scroll after the demo ends. */
  useEffect(() => {
    if (runState !== 'ended') {
      didScrollAfterEndRef.current = false;
      return;
    }
    if (didScrollAfterEndRef.current) return;
    didScrollAfterEndRef.current = true;
    const id = window.requestAnimationFrame(() => {
      activeWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [runState]);

  const statusLabel =
    runState === 'playing'
      ? 'Neural Voice Active'
      : runState === 'paused'
        ? 'Paused — tap play to resume'
        : runState === 'ended'
          ? 'Demo finished — tap to replay'
          : 'Preview Intelligence';

  return (
    <section
      id="neural-sync"
      aria-labelledby="neural-sync-heading"
      className="py-14 sm:py-20 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5 overflow-hidden"
    >
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
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(79,70,229,0.5)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                aria-label={
                  isPlaying ? 'Pause Neural Sync demo' : runState === 'paused' ? 'Resume Neural Sync demo' : 'Play Neural Sync demo'
                }
              >
                {!isPlaying && (
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

              {/* Visualizer: moving bars */}
              <div className="flex items-end justify-center gap-1 h-12">
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

            {/* Right: Glassmorphism text block — Band 9 sample + word highlight */}
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-2xl border border-white/10 dark:border-white/10 p-5 sm:p-6 max-h-[280px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    Band 9.0 Sample
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-600 text-sm sm:text-base leading-relaxed font-medium tracking-wide">
                  {wordTimings.map((w, i) => {
                    const active = i === activeWordIndex;
                    return (
                      <span key={i}>
                        <span
                          ref={active ? activeWordRef : undefined}
                          className={
                            active
                              ? 'text-white bg-indigo-600 rounded px-0.5 py-px shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-150 inline-block'
                              : 'text-slate-700 dark:text-slate-600 transition-colors duration-300'
                          }
                        >
                          {w.word}
                        </span>
                        {i < wordTimings.length - 1 ? ' ' : ''}
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
