'use client';

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Headphones, Loader2, Play, Pause } from 'lucide-react';
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

/**
 * Inserts \n\n after sentence-ending punctuation before common IELTS paragraph openers
 * (introduction / body / conclusion style flow). Does not add tokens — only whitespace.
 */
export function insertLogicalParagraphBreaks(text) {
  let s = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const phrases = [
    'In the final period',
    'In conclusion',
    'By the last',
    'Overall',
    'Between',
    'From',
  ];
  for (const phrase of phrases) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`([.!?])\\s+(${esc})\\b`, 'gi');
    s = s.replace(re, (_, punct, p) => `${punct}\n\n${p}`);
  }
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

/** Maps paragraph slices to global word indices; aligns with getWordTimings after whitespace collapse. */
export function getParagraphWordRanges(text) {
  const paras = (text || '').split(/\n\s*\n/).filter(Boolean);
  const ranges = [];
  let idx = 0;
  for (const p of paras) {
    const n = p.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    if (n === 0) continue;
    ranges.push({ start: idx, end: idx + n });
    idx += n;
  }
  return ranges;
}

/** Longest multi-word phrases first so regex / window matching prefer full collocations. */
const LINKING_PHRASES = [
  'The bar chart illustrates',
  'In conclusion',
  'Nevertheless',
  'By the last',
  'Moreover',
  'However',
  'Between',
  'From',
];

function normalizeWordToken(w) {
  return String(w || '')
    .replace(/^[.,!?;:'"()[\]]+|[.,!?;:'"()[\]]+$/g, '')
    .toLowerCase();
}

function phraseToRegexPattern(phrase) {
  return phrase
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
}

/** Splits paragraph text and wraps linking phrases in <strong className="font-bold">. */
export function renderParagraphWithLinkingPhrases(text) {
  const sorted = [...LINKING_PHRASES].sort((a, b) => b.length - a.length);
  if (!text || sorted.length === 0) return text;
  const inner = `(${sorted.map(phraseToRegexPattern).join('|')})`;
  const re = new RegExp(inner, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function buildLinkingWordMask(wordTimingList) {
  const words = wordTimingList.map((t) => t.word);
  const n = words.length;
  const mask = new Array(n).fill(false);
  const sorted = [...LINKING_PHRASES].sort(
    (a, b) => b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length
  );
  for (const phrase of sorted) {
    const pw = phrase.split(/\s+/);
    const L = pw.length;
    if (L === 0) continue;
    for (let s = 0; s <= n - L; s++) {
      let ok = true;
      for (let k = 0; k < L; k++) {
        if (normalizeWordToken(words[s + k]) !== normalizeWordToken(pw[k])) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let k = 0; k < L; k++) mask[s + k] = true;
      }
    }
  }
  return mask;
}

const WAVEFORM = Array.from({ length: 34 }, (_, i) => 0.28 + Math.abs(Math.sin(i * 0.92 + 0.7)) * 0.72);

export default function SuggestedRewriteKaraoke({
  bandScore,
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
  fullBleedLayout = false,
}) {
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const activeWordIndexRef = useRef(-1);
  const karaokeScrollRef = useRef(null);
  const activeWordRef = useRef(null);

  const segmentedRewrite = useMemo(() => insertLogicalParagraphBreaks(suggestedRewrite || ''), [suggestedRewrite]);

  const plainTextForTimings = useMemo(
    () => segmentedRewrite.replace(/\s+/g, ' ').trim(),
    [segmentedRewrite]
  );

  const wordTimings = useMemo(
    () => getWordTimings(plainTextForTimings, audioDuration),
    [plainTextForTimings, audioDuration]
  );

  const karaokeParagraphRanges = useMemo(() => {
    const total = wordTimings.length;
    if (total === 0) return [];
    const ranges = getParagraphWordRanges(segmentedRewrite);
    const covered = ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
    if (ranges.length === 0 || covered !== total) {
      return [{ start: 0, end: total }];
    }
    return ranges;
  }, [segmentedRewrite, wordTimings.length]);

  const linkingWordMask = useMemo(() => buildLinkingWordMask(wordTimings), [wordTimings]);

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

  const bandLabel =
    bandScore != null && String(bandScore).trim() !== '' ? String(bandScore).trim() : '—';

  useEffect(() => {
    if (activeWordIndex >= 0 && activeWordRef.current && karaokeScrollRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeWordIndex]);

  const staticParas = segmentedRewrite.split(/\n\s*\n/).filter(Boolean);

  const paraClass =
    'mb-6 text-lg leading-[1.8] font-serif text-slate-700 dark:text-slate-300 last:mb-0 whitespace-pre-wrap';

  const sectionClass =
    'relative z-20 w-full max-w-none h-auto overflow-visible rounded-2xl border border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80';

  const inner = (
    <>
      <header
        className={`w-full border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 dark:border-slate-800/50 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-violet-950/30 ${
          fullBleedLayout ? 'px-6 py-7 sm:px-10 sm:py-9' : 'px-6 py-5 sm:px-8'
        }`}
      >
        <h2
          className={`w-full font-black uppercase tracking-[0.22em] text-slate-900 dark:text-slate-50 ${
            fullBleedLayout
              ? 'text-center text-lg sm:text-2xl'
              : 'text-center text-base sm:text-left sm:text-lg'
          }`}
        >
          IELTS Band Score
        </h2>
        <p
          className={`mt-2 w-full text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${
            fullBleedLayout ? 'text-center' : 'text-center sm:text-left'
          }`}
        >
          Suggested rewrite · AI voice &amp; karaoke
        </p>
      </header>

        <div className="flex w-full items-center justify-between gap-4 border-b border-slate-100 bg-white/60 px-6 py-4 dark:border-slate-800/50 dark:bg-slate-900/60 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1 font-black text-xl tabular-nums text-white shadow-lg shadow-indigo-500/20">
              {bandLabel}
            </div>
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:inline">
              Model band
            </span>
          </div>
          {audioTime > 0 ? (
            <span className="shrink-0 font-mono text-[10px] text-slate-400 dark:text-slate-500">
              {formatTime(audioTime)} / {formatTime(audioDuration)}
            </span>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
        <div className="mb-8 bg-slate-900 dark:bg-black/50 rounded-2xl p-3 flex items-center gap-4 border border-white/5">
          <audio ref={audioRef} src={audioUrl || undefined} className="hidden" preload="metadata" />

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!audioUrl || isAudioLoading}
            className="h-10 w-10 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center text-white shrink-0 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isAudioLoading ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.span>
              ) : isPlaying ? (
                <motion.span key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Pause className="w-5 h-5" fill="currentColor" />
                </motion.span>
              ) : (
                <motion.span key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div
            className="flex-1 min-w-0 h-8 flex items-center gap-[2px] cursor-pointer group"
            onClick={onSeek}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(audioProgress * 100)}
            tabIndex={0}
          >
            {WAVEFORM.map((h, idx) => {
              const progress = (idx + 1) / WAVEFORM.length;
              const isFilled = audioProgress >= progress;
              return (
                <motion.span
                  key={idx}
                  initial={false}
                  animate={{
                    height: `${h * 100}%`,
                    backgroundColor: isFilled ? '#818cf8' : '#334155',
                  }}
                  className="w-1 rounded-full transition-colors group-hover:opacity-80"
                />
              );
            })}
          </div>

          <span className="hidden sm:block text-[10px] font-mono text-white/50 tracking-tighter shrink-0 whitespace-nowrap">
            AI VOICE
          </span>

          <button
            type="button"
            onClick={onGenerateAudio}
            disabled={!suggestedRewrite || isAudioLoading}
            className="h-10 px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all shrink-0 flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
            title="Generate audio"
          >
            {isAudioLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Headphones className="w-3 h-3" />}
            <span className="hidden md:inline">AI Voice</span>
          </button>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none h-auto min-h-0 overflow-visible overflow-x-visible">
          {audioError ? (
            <div className="mb-6 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-500 text-center not-prose">
              {audioError}
            </div>
          ) : null}

          {audioUrl && wordTimings.length > 0 ? (
            <div className="not-prose h-auto overflow-visible">
              {karaokeParagraphRanges.map((range, pi) => (
                <p key={pi} className={paraClass}>
                  {wordTimings.slice(range.start, range.end).map((w, i) => {
                    const globalIndex = range.start + i;
                    const isActive = globalIndex === activeWordIndex;
                    const isPlayed = activeWordIndex >= 0 && globalIndex < activeWordIndex;
                    return (
                      <span key={globalIndex} className="inline-block mr-1.5 mb-1">
                        <span
                          ref={isActive ? activeWordRef : undefined}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleWordClick(globalIndex)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleWordClick(globalIndex);
                            }
                          }}
                          className={[
                            'inline-block px-1 rounded transition-all cursor-pointer',
                            linkingWordMask[globalIndex] ? 'font-bold' : '',
                            isActive
                              ? 'bg-indigo-500 text-white'
                              : isPlayed
                                ? 'text-slate-900 dark:text-slate-100 underline decoration-indigo-500/40'
                                : 'text-slate-700 dark:text-slate-300',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={`Word: ${w.word}, click to seek`}
                        >
                          {w.word}
                        </span>
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          ) : staticParas.length > 0 ? (
            <div className="not-prose h-auto overflow-visible">
              {staticParas.map((para, idx) => (
                <p key={idx} className={paraClass}>
                  {renderParagraphWithLinkingPhrases(para)}
                </p>
              ))}
            </div>
          ) : (
            <div className="not-prose h-auto overflow-visible">
              <p className={paraClass}>{renderParagraphWithLinkingPhrases(segmentedRewrite || suggestedRewrite || '')}</p>
            </div>
          )}
        </div>
        </div>
    </>
  );

  if (fullBleedLayout) {
    return (
      <div className="w-full px-4 sm:px-6 mt-12 mb-12">
        <motion.section
          ref={karaokeScrollRef}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={sectionClass}
        >
          <div className="mx-auto w-full max-w-6xl">{inner}</div>
        </motion.section>
      </div>
    );
  }

  return (
    <motion.section
      ref={karaokeScrollRef}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={sectionClass}
    >
      <div className="mx-auto w-full max-w-6xl">{inner}</div>
    </motion.section>
  );
}
