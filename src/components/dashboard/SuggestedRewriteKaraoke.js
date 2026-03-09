'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Headphones, Loader2, Volume2, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Smart Word-Highlighting Karaoke: word timings with punctuation-based pause tuning.
 * Base duration per word; +20% for words ending in ",", +40% for "." or "?".
 */
export function getWordTimings(text, totalDuration) {
  const words = (text || '').split(' ').filter(Boolean);
  if (words.length === 0 || !Number.isFinite(totalDuration) || totalDuration <= 0) return [];
  const multipliers = words.map((w) => {
    const last = w.slice(-1);
    if (last === '.' || last === '?') return 1.4;
    if (last === ',') return 1.2;
    return 1;
  });
  const totalMultipliers = multipliers.reduce((a, b) => a + b, 0);
  const baseUnit = totalDuration / totalMultipliers;
  const result = [];
  let start = 0;
  for (let i = 0; i < words.length; i++) {
    const duration = baseUnit * multipliers[i];
    const end = i === words.length - 1 ? totalDuration : start + duration;
    result.push({ word: words[i], start, end });
    start = end;
  }
  return result;
}

const WAVEFORM = Array.from({ length: 34 }, (_, i) => 0.28 + Math.abs(Math.sin(i * 0.92 + 0.7)) * 0.72);

export default function SuggestedRewriteKaraoke({
  suggestedRewrite,
  audioRef,
  audioUrl,
  audioDuration,
  isAudioLoading,
  isPlaying,
  audioProgress,
  audioTime,
  audioError,
  onGenerateAudio,
  onTogglePlay,
  onSeek,
  formatTime,
}) {
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const activeWordIndexRef = useRef(-1);
  const karaokeScrollRef = useRef(null);
  const activeWordRef = useRef(null);

  const wordTimings = useMemo(
    () => getWordTimings(suggestedRewrite || '', audioDuration),
    [suggestedRewrite, audioDuration]
  );

  const handleWordClick = useCallback(
    (index) => {
      if (!audioRef?.current || index < 0 || index >= wordTimings.length) return;
      const w = wordTimings[index];
      audioRef.current.currentTime = w.start;
      activeWordIndexRef.current = index;
      setActiveWordIndex(index);
      audioRef.current.play().then(() => {}).catch(() => {});
    },
    [audioRef, wordTimings]
  );

  useEffect(() => {
    const el = audioRef?.current;
    if (!el || !audioUrl) return;
    const onTimeUpdate = () => {
      const current = el.currentTime || 0;
      if (wordTimings.length > 0) {
        const tolerance = 0.05;
        let idx = -1;
        for (let i = 0; i < wordTimings.length; i++) {
          const w = wordTimings[i];
          if (current >= w.start && current < w.end + tolerance) {
            idx = i;
            break;
          }
        }
        if (idx !== activeWordIndexRef.current) {
          activeWordIndexRef.current = idx;
          setActiveWordIndex(idx);
        }
      }
    };
    const onEnded = () => {
      activeWordIndexRef.current = -1;
      setActiveWordIndex(-1);
    };
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, wordTimings]);

  useEffect(() => {
    if (activeWordIndex >= 0 && activeWordRef.current && karaokeScrollRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeWordIndex]);

  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="mt-2 sm:mt-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm backdrop-blur-sm p-3 sm:p-4 ring-1 ring-slate-100/50 dark:ring-slate-800/50"
    >
      <div className="flex flex-col gap-2 sm:gap-3">
        <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">Suggested rewrite</h2>

        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center gap-2 sm:gap-3 text-white w-full">
          <audio ref={audioRef} src={audioUrl || undefined} className="hidden" preload="metadata" />

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!audioUrl || isAudioLoading}
            className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/10 border border-white/10 hover:border-indigo-300/50 hover:bg-white/15 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isAudioLoading ? (
                <motion.span key="loading" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                </motion.span>
              ) : isPlaying ? (
                <motion.span key="pause" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.span>
              ) : (
                <motion.span key="volume" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}>
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/80 whitespace-nowrap shrink-0">
              {formatTime(audioTime)}<span className="text-white/40">/</span>{formatTime(audioDuration)}
            </div>
            <div
              className="flex items-end gap-[1px] h-6 sm:h-7 flex-1 min-w-0 max-w-[180px] sm:max-w-[220px] md:max-w-none px-1.5 sm:px-2 rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer"
              onClick={onSeek}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(audioProgress * 100)}
              tabIndex={0}
            >
              {WAVEFORM.map((h, idx) => {
                const filled = audioProgress >= (idx + 1) / WAVEFORM.length;
                return (
                  <span
                    key={idx}
                    className={filled ? 'bg-indigo-400/90' : 'bg-white/20'}
                    style={{ width: 2, height: `${Math.round(h * 100)}%`, borderRadius: 999, transition: 'background-color 200ms ease' }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onGenerateAudio}
            disabled={!suggestedRewrite || isAudioLoading}
            className="inline-flex items-center justify-center min-h-[36px] sm:min-h-[40px] gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:border-indigo-300/50 hover:text-indigo-100 hover:bg-white/15 transition-colors disabled:opacity-50 disabled:pointer-events-none font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px] shrink-0"
            title="Generate audio"
          >
            {isAudioLoading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 animate-spin" /> : <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
      </div>

      {audioError ? (
        <div className="mt-2 text-[10px] font-medium text-rose-600 dark:text-rose-300">{audioError}</div>
      ) : null}

      <motion.div
        ref={karaokeScrollRef}
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
        className="bg-transparent leading-relaxed break-words border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 py-2 pr-2 text-sm sm:text-base"
      >
        {audioUrl && wordTimings.length > 0 ? (
          <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 font-medium leading-loose">
            {wordTimings.map((w, i) => {
              const isActive = i === activeWordIndex;
              const isPlayed = activeWordIndex >= 0 && i < activeWordIndex;
              return (
                <span key={i}>
                  <motion.span
                    ref={isActive ? activeWordRef : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleWordClick(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleWordClick(i);
                      }
                    }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold tracking-tight scale-105 inline-block leading-[1.35] align-middle cursor-pointer transition-all duration-150 ease-out origin-center'
                        : isPlayed
                          ? 'text-slate-900 dark:text-slate-100 opacity-100 inline-block leading-[1.35] align-middle cursor-pointer transition-all duration-150 ease-out'
                          : 'text-slate-600 dark:text-slate-400 font-medium inline-block leading-[1.35] align-middle cursor-pointer transition-all duration-150 ease-out'
                    }
                    aria-label={`Word: ${w.word}, click to seek`}
                  >
                    {w.word}
                  </motion.span>
                  {i < wordTimings.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </p>
        ) : (
          suggestedRewrite
            .split(/\n\s*\n/g)
            .filter(Boolean)
            .map((para, idx) => (
              <motion.p
                key={idx}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={idx === 0 ? 'whitespace-pre-wrap' : 'whitespace-pre-wrap mt-3'}
              >
                {para}
              </motion.p>
            ))
        )}
      </motion.div>
    </motion.section>
  );
}
