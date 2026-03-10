'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SuggestedRewriteKaraoke from './dashboard/SuggestedRewriteKaraoke';

// ─── Dynamic content by activeTab ─────────────────────────────────────────────
const LABELS = {
  'Task 1': {
    left: 'OBSERVATIONAL DRAFT — BAND 5.0',
    right: 'ACADEMIC DATA REPORT — BAND 8.5+',
    insights: [
      '✓ Precise data mapping',
      "✓ Objective tone (no 'I/me')",
      '✓ Trend vocabulary used',
    ],
  },
  'Task 2': {
    left: 'ARGUMENTATIVE DRAFT — BAND 5.5',
    right: 'ACADEMIC ESSAY — BAND 8.5+',
    insights: [
      '✓ Strong thesis statement',
      '✓ Complex nominalization',
      '✓ Advanced logical connectors',
    ],
  },
};

// Task 1 draft: Red = inaccurate data / subjective, Blue = simple trend verbs, Indigo = comparison (longer phrases first)
const T1_DRAFT_HIGHLIGHTS = [
  { text: 'In contrast to', type: 'indigo' },
  { text: 'In contrast', type: 'indigo' },
  { text: 'Compared with', type: 'indigo' },
  { text: 'Compared to', type: 'indigo' },
  { text: 'By comparison', type: 'indigo' },
  { text: 'went up', type: 'blue', suggestion: '→ rose / increased / climbed' },
  { text: 'went down', type: 'blue', suggestion: '→ fell / declined / dropped' },
  { text: 'go up', type: 'blue' },
  { text: 'go down', type: 'blue' },
  { text: 'a lot', type: 'blue', suggestion: '→ significantly / substantially' },
  { text: 'I think', type: 'red' },
  { text: ' I ', type: 'red' },
  { text: ' I.', type: 'red' },
  { text: 'I ', type: 'red', suggestion: '→ Remove first person; use passive or "The chart shows"' },
  { text: ' me ', type: 'red' },
  { text: ' my ', type: 'red' },
  { text: ' we ', type: 'red' },
  { text: ' our ', type: 'red' },
];

// Task 2 draft: Red = grammar / personal pronouns, Blue = low-level vocab
const T2_DRAFT_HIGHLIGHTS = [
  { text: 'I think', type: 'red', suggestion: '→ It is widely argued that' },
  { text: 'good', type: 'blue', suggestion: '→ beneficial / positive' },
  { text: 'easy', type: 'blue', suggestion: '→ straightforward / readily' },
  { text: 'bad', type: 'blue', suggestion: '→ detrimental / counterproductive' },
  { text: 'lazy', type: 'blue', suggestion: '→ intellectually passive' },
  { text: "don't need", type: 'red', suggestion: '→ need not / are no longer required to' },
  { text: 'In the end', type: 'red', suggestion: '→ Ultimately' },
  { text: 'very helpful', type: 'blue', suggestion: '→ highly beneficial / indispensable' },
  { text: ' things ', type: 'blue', suggestion: '→ aspects / factors' },
  { text: 'big', type: 'blue', suggestion: '→ substantial / significant' },
];

// Task 2 rewrite: Gold = academic verbs & advanced nouns, Indigo = connectors (Purple optional for verbs)
const T2_REWRITE_PHRASES = [
  { type: 'connector', phrases: ['It is widely argued that', 'While', 'Furthermore', 'Ultimately', 'Moreover', 'Conversely', 'Nevertheless'] },
  { type: 'verb', phrases: ['revolutionized', 'induce', 'assert', 'foster', 'maintain', 'enhances', 'transition'] },
  { type: 'noun', phrases: ['intellectual passivity', 'information repositories', 'pedagogical roles', 'learning environment', 'digital literacy', 'research efficiency'] },
];

// Task 1 rewrite: Indigo = comparison, Blue = trend vocabulary
const T1_REWRITE_PHRASES = [
  { type: 'indigo', phrases: ['In contrast', 'Compared to', 'By comparison', 'Whereas', 'While'] },
  { type: 'blue', phrases: ['significantly', 'substantially', 'steadily', 'gradually', 'peaked', 'plateaued', 'fluctuated'] },
];

function getDraftSegments(text, activeTab) {
  if (!text || !text.trim()) return [{ text: text || '', type: null, suggestion: null }];
  const list = activeTab === 'Task 1' ? T1_DRAFT_HIGHLIGHTS : T2_DRAFT_HIGHLIGHTS;
  const segments = [];
  const lower = text.toLowerCase();
  let i = 0;
  let normalBuf = '';
  while (i < text.length) {
    let matched = false;
    for (const h of list) {
      const phrase = h.text;
      const phraseLower = phrase.toLowerCase();
      const restLower = lower.substring(i);
      if (restLower.startsWith(phraseLower)) {
        if (normalBuf.length) {
          segments.push({ text: normalBuf, type: null, suggestion: null });
          normalBuf = '';
        }
        segments.push({ text: text.slice(i, i + phrase.length), type: h.type, suggestion: h.suggestion || null });
        i += phrase.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      normalBuf += text[i];
      i += 1;
    }
  }
  if (normalBuf.length) segments.push({ text: normalBuf, type: null, suggestion: null });
  return segments.length ? segments : [{ text: text, type: null, suggestion: null }];
}

function getRewriteSegments(text, activeTab) {
  if (!text || !text.trim()) return [{ text: text || '', type: null }];
  const byStart = [];
  const source = activeTab === 'Task 1' ? T1_REWRITE_PHRASES : T2_REWRITE_PHRASES;
  source.forEach(({ type, phrases }) => {
    phrases.forEach((phrase) => {
      let pos = 0;
      let idx;
      while ((idx = text.indexOf(phrase, pos)) !== -1) {
        byStart.push({ start: idx, end: idx + phrase.length, type, text: phrase });
        pos = idx + 1;
      }
    });
  });
  byStart.sort((a, b) => a.start - b.start);
  const merged = [];
  byStart.forEach((h) => {
    const overlap = merged.some((m) => h.start < m.end && h.end > m.start);
    if (!overlap) merged.push(h);
  });
  const segments = [];
  let last = 0;
  merged.forEach(({ start, end, type, text: phrase }) => {
    if (start > last) segments.push({ text: text.slice(last, start), type: null });
    segments.push({ text: phrase, type });
    last = end;
  });
  if (last < text.length) segments.push({ text: text.slice(last), type: null });
  return segments.length ? segments : [{ text: text, type: null }];
}

const DRAFT_STYLES = {
  red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-0.5 border-b-2 border-red-400 dark:border-red-500/80',
  blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded px-0.5 border-b-2 border-blue-400 dark:border-blue-500/80',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 rounded px-0.5 border-b-2 border-indigo-400 dark:border-indigo-500/80',
};

const REWRITE_STYLES_T1 = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
};

const REWRITE_STYLES_T2 = {
  connector: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100',
  verb: 'bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100',
  noun: 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100',
};

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || 'audio/mpeg' });
}

async function fetchTtsWithTimestamps({ text, filenameBase }) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename: filenameBase }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'TTS failed');
  }
  const data = await response.json();
  const blob = data.audioBase64 ? base64ToBlob(data.audioBase64) : null;
  return { blob };
}

export default function ComparisonLab({
  activeTab,
  draftText,
  suggestedRewrite,
  darkMode,
  className = '',
}) {
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);

  const labels = LABELS[activeTab] || LABELS['Task 2'];
  const draftSegments = useMemo(() => getDraftSegments(draftText || '', activeTab), [draftText, activeTab]);
  const rewriteSegments = useMemo(() => getRewriteSegments(suggestedRewrite || '', activeTab), [suggestedRewrite, activeTab]);
  const rewriteStyles = activeTab === 'Task 1' ? REWRITE_STYLES_T1 : REWRITE_STYLES_T2;

  const formatTime = useCallback((s) => {
    const n = Number.isFinite(Number(s)) ? Math.max(0, Math.floor(s)) : 0;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }, []);

  const audioFilenameBase = activeTab === 'Task 1' ? 'Stratum_Task1_Comparison' : 'Stratum_Task2_Comparison';

  const handleGenerateAudio = useCallback(async () => {
    if (!suggestedRewrite || isAudioLoading) return;
    setIsAudioLoading(true);
    setAudioError('');
    try {
      const { blob } = await fetchTtsWithTimestamps({ text: suggestedRewrite, filenameBase: audioFilenameBase });
      const url = window.URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setIsPlaying(false);
      setAudioProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {
      setAudioError(e?.message || 'Unable to generate audio.');
    } finally {
      setIsAudioLoading(false);
    }
  }, [suggestedRewrite, audioFilenameBase, isAudioLoading]);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl || isAudioLoading) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [audioUrl, isAudioLoading]);

  const handleSeek = useCallback((e) => {
    if (!audioRef.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => {
      const d = el.duration || 0;
      const c = el.currentTime || 0;
      setAudioProgress(d > 0 ? c / d : 0);
      setAudioTime(c);
      setAudioDuration(d);
    };
    const onLoaded = () => setAudioDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => { if (audioUrl) window.URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const container = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  };
  const leftPanel = {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.35, delay: 0.05 },
  };
  const rightPanel = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.35, delay: 0.1 },
  };

  const bandLeft = activeTab === 'Task 1' ? 'Band 5.0' : 'Band 5.5';
  const bandRight = 'Band 8.5+';

  return (
    <motion.div {...container} className={`relative rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden ${className}`}>
      {/* VS badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 pointer-events-none">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200/90 dark:bg-slate-600/90 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm backdrop-blur-sm">
          vs
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 relative">
        {/* Left — Draft */}
        <motion.div
          {...leftPanel}
          className="relative p-5 sm:p-6 lg:p-8 min-h-[180px] flex flex-col bg-white/[0.02] dark:bg-white/[0.02]"
        >
          <div className="mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {labels.left}
            </span>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-serif flex-1">
            &ldquo;
            {draftSegments.map((seg, i) =>
              seg.type ? (
                <span
                  key={i}
                  className={`cursor-default ${DRAFT_STYLES[seg.type] || DRAFT_STYLES.blue} pointer-events-auto inline`}
                  onMouseEnter={(e) => {
                    if (seg.suggestion) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ show: true, text: seg.suggestion, x: rect.left + rect.width / 2, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setTooltip((t) => ({ ...t, show: false }))}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
            &rdquo;
          </p>
          <div className="mt-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {bandLeft}
          </div>
        </motion.div>

        {/* Right — Suggested Rewrite + Karaoke */}
        <motion.div
          {...rightPanel}
          className="relative p-5 sm:p-6 lg:p-8 min-h-[180px] flex flex-col bg-white/[0.02] dark:bg-white/[0.02]"
        >
          <div className="mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {labels.right}
            </span>
          </div>
          <div className="flex gap-4 flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 font-serif">
                &ldquo;
                {rewriteSegments.map((seg, i) =>
                  seg.type ? (
                    <span key={i} className={`rounded-sm px-0.5 ${rewriteStyles[seg.type] ?? ''}`}>
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
                &rdquo;
              </p>
              {/* Karaoke pinned at bottom of Suggested Rewrite column */}
              <div className="mt-4 flex-shrink-0">
                <SuggestedRewriteKaraoke
                  suggestedRewrite={suggestedRewrite}
                  audioRef={audioRef}
                  audioUrl={audioUrl}
                  audioDuration={audioDuration}
                  isAudioLoading={isAudioLoading}
                  isPlaying={isPlaying}
                  audioProgress={audioProgress}
                  audioTime={audioTime}
                  audioError={audioError}
                  onGenerateAudio={handleGenerateAudio}
                  onTogglePlay={handleTogglePlay}
                  onSeek={handleSeek}
                  formatTime={formatTime}
                />
              </div>
            </div>
            <div className="hidden sm:flex flex-col w-36 shrink-0 pl-4 border-l border-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Insights
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {labels.insights.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-3 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {bandRight}
          </div>
          <div className="sm:hidden mt-3 pt-3 border-t border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2">Insights</span>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {labels.insights.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 dark:text-emerald-400 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="px-5 sm:px-6 lg:px-8 py-3 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Legend:</span>
        {activeTab === 'Task 1' ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-600" /> Inaccurate / Subjective
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-600" /> Simple trend verbs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-600" /> Comparison structures
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-600" /> Grammar / Personal pronouns
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-600" /> Low-level vocab
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-600" /> Connectors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-300 dark:bg-violet-600" /> Academic Verbs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-300 dark:bg-amber-600" /> Advanced Nouns
            </span>
          </>
        )}
      </div>

      {tooltip.show && tooltip.text && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium shadow-xl border border-slate-700 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}
    </motion.div>
  );
}
