'use client';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Zap, BookOpen, GitBranch, ChevronDown } from 'lucide-react';
import { downloadCheckReport } from '@/lib/downloadReportPdf';
import SuggestedRewriteKaraoke from './SuggestedRewriteKaraoke';

const FEED_LABEL = { grammar: 'Grammar', lexical: 'Vocabulary', cohesion: 'Cohesion' };

function getAudioFilenameBase(taskType) {
  return taskType === 'TASK_1' ? 'Stratum_Task1_Model' : 'Stratum_Task2_Model';
}

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
    let message = 'TTS failed';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = await response.json();
  const blob = data.audioBase64 ? base64ToBlob(data.audioBase64) : null;
  const wordTimestamps = Array.isArray(data.wordTimestamps) ? data.wordTimestamps : [];
  return { blob, wordTimestamps };
}


function underlineClass(type) {
  if (type === 'grammar') return 'underline-grammar';
  if (type === 'lexical') return 'underline-vocab';
  return 'underline-cohesion';
}

function buildSegments(content, highlights, corrections) {
  const items = [];
  (highlights || []).forEach((h, i) => {
    items.push({ text: h.text, type: h.type || 'grammar', suggestion: h.suggestion, id: `h-${i}`, kind: 'highlight' });
  });
  (corrections || []).forEach((c, i) => {
    const type = (c.category || '').toLowerCase().includes('lexical') || (c.category || '').toLowerCase().includes('vocab') ? 'lexical' : 'grammar';
    items.push({
      text: c.original,
      type,
      suggestion: c.explanation || c.impact,
      id: `c-${i}`,
      kind: 'correction',
      fixed: c.fixed,
      impact: c.impact,
    });
  });
  if (!items.length) return [{ text: content, type: null, id: null }];
  const sorted = [...items].sort((a, b) => {
    const posA = content.toLowerCase().indexOf(a.text.toLowerCase());
    const posB = content.toLowerCase().indexOf(b.text.toLowerCase());
    if (posA === -1 && posB === -1) return 0;
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
  const segments = [];
  let lastEnd = 0;
  for (const it of sorted) {
    const pos = content.toLowerCase().indexOf(it.text.toLowerCase(), lastEnd);
    if (pos === -1) continue;
    if (pos > lastEnd) segments.push({ text: content.slice(lastEnd, pos), type: null, id: null });
    segments.push({ ...it });
    lastEnd = pos + it.text.length;
  }
  if (lastEnd < content.length) segments.push({ text: content.slice(lastEnd), type: null, id: null });
  return segments;
}

export default function AnalyticalLab({ check }) {
  const feedback = useMemo(() => {
    try {
      return typeof check.feedback === 'string' ? JSON.parse(check.feedback) : (check.feedback || {});
    } catch {
      return {};
    }
  }, [check.feedback]);

  const [focusedId, setFocusedId] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(null); // 'grammar' | 'vocabulary' | 'cohesion' | null (mobile feedback)
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const criteria = feedback.criteria || {};
  const taskKey = check.type === 'TASK_1' ? 'Task_Achievement' : 'Task_Response';
  const ta = criteria[taskKey]?.score ?? 0;
  const cc = criteria.Coherence_and_Cohesion?.score ?? 0;
  const lr = criteria.Lexical_Resource?.score ?? 0;
  const gra = criteria.Grammatical_Range_and_Accuracy?.score ?? 0;
  const band = feedback.overall_band != null ? Number(feedback.overall_band) : null;

  const highlights = Array.isArray(feedback.highlights) ? feedback.highlights : [];
  const corrections = Array.isArray(feedback.corrections) ? feedback.corrections : [];
  const lexicalUpgrade = Array.isArray(feedback.lexical_upgrade) ? feedback.lexical_upgrade : [];
  const suggestedRewrite = feedback.suggested_rewrite || '';
  const audioRef = useRef(null);
  const audioFilenameBase = getAudioFilenameBase(check.type);
  const audioDownloadName = `${audioFilenameBase}.mp3`;
  const segments = useMemo(
    () => buildSegments(check.content || '', highlights, corrections),
    [check.content, highlights, corrections]
  );

  const formatTime = useCallback((seconds) => {
    const s = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(seconds)) : 0;
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const feedItems = useMemo(() => {
    const list = [];
    highlights.forEach((h, i) => list.push({ id: `h-${i}`, type: h.type || 'grammar', label: FEED_LABEL[h.type] || h.type, text: h.text, suggestion: h.suggestion, kind: 'highlight' }));
    corrections.forEach((c, i) => {
      const type = (c.category || '').toLowerCase().includes('lexical') || (c.category || '').toLowerCase().includes('vocab') ? 'lexical' : 'grammar';
      list.push({
        id: `c-${i}`,
        type,
        label: c.category || type,
        text: c.original,
        suggestion: c.explanation,
        fixed: c.fixed,
        impact: c.impact,
        kind: 'correction',
      });
    });
    return list;
  }, [highlights, corrections]);

  /** Build bullet lists and quick-fix per criterion for the feedback dashboard. */
  const feedbackCards = useMemo(() => {
    const toBullets = (text) => {
      if (!text || typeof text !== 'string') return [];
      return text
        .split(/\n+|\.\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
    };
    const grammarItems = feedItems.filter((i) => i.type === 'grammar');
    const lexicalItems = feedItems.filter((i) => i.type === 'lexical');
    const cohesionItems = feedItems.filter((i) => i.type === 'cohesion');
    const pickQuickFix = (items) => {
      const high = items.find((i) => i.impact === 'high');
      return high?.suggestion || (items[0] && (items[0].suggestion || (items[0].fixed ? `Use "${items[0].fixed}"` : null))) || null;
    };
    return [
      {
        key: 'grammar',
        title: 'Grammar',
        Icon: Zap,
        score: gra,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        comment: criteria.Grammatical_Range_and_Accuracy?.comment,
        items: grammarItems,
        quickFix: pickQuickFix(grammarItems) || (criteria.Grammatical_Range_and_Accuracy?.comment ? toBullets(criteria.Grammatical_Range_and_Accuracy.comment)[0] : null),
      },
      {
        key: 'vocabulary',
        title: 'Vocabulary',
        Icon: BookOpen,
        score: lr,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        comment: criteria.Lexical_Resource?.comment,
        items: lexicalItems,
        quickFix: pickQuickFix(lexicalItems) || (criteria.Lexical_Resource?.comment ? toBullets(criteria.Lexical_Resource.comment)[0] : null),
      },
      {
        key: 'cohesion',
        title: 'Cohesion',
        Icon: GitBranch,
        score: cc,
        iconColor: 'text-amber-600 dark:text-amber-400',
        comment: criteria.Coherence_and_Cohesion?.comment,
        items: cohesionItems,
        quickFix: pickQuickFix(cohesionItems) || (criteria.Coherence_and_Cohesion?.comment ? toBullets(criteria.Coherence_and_Cohesion.comment)[0] : null),
      },
    ];
  }, [feedItems, criteria, gra, lr, cc]);

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
      setAudioError(e?.message || 'Unable to generate audio right now.');
    } finally {
      setIsAudioLoading(false);
    }
  }, [suggestedRewrite, audioFilenameBase, isAudioLoading]);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl || isAudioLoading) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch {
      // ignore (e.g. user gesture restriction)
    }
  }, [audioUrl, isAudioLoading]);

  const handleSeek = useCallback((e) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  }, []);

  const handleDownloadMp3 = useCallback(() => {
    if (!audioBlob) return;
    const url = window.URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = audioDownloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }, [audioBlob, audioDownloadName]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const duration = el.duration || 0;
      const current = el.currentTime || 0;
      setAudioProgress(duration > 0 ? current / duration : 0);
      setAudioTime(current);
      setAudioDuration(duration);
    };
    const onLoaded = () => {
      const duration = el.duration || 0;
      setAudioDuration(duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setAudioProgress(1);
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) window.URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const cardRefs = React.useRef({});
  const scrollToCard = useCallback((id) => {
    setFocusedId(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  /** Single feedback card content (shared by desktop card and accordion body) */
  const renderFeedbackCardContent = (card) => {
    const Icon = card.Icon;
    const isActive = card.items.some((it) => it.id === focusedId);
    const commentBullets = (card.comment && typeof card.comment === 'string')
      ? card.comment.split(/\n+|\.\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 6)
      : [];
    const listItems = [
      ...commentBullets.map((b) => ({ type: 'comment', text: b })),
      ...card.items.map((it) => ({
        type: 'item',
        text: it.fixed ? `"${it.text}" → "${it.fixed}"` : (it.suggestion || `"${it.text}"`),
        id: it.id,
      })),
    ].slice(0, 12);
    return (
      <>
        {/* Band score circle — top-right anchor */}
        <div className="absolute top-4 right-4 h-9 w-9 shrink-0">
          <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-200 dark:text-slate-700" />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={card.score != null ? `${(card.score / 9) * 100}, 100` : '0, 100'}
              strokeLinecap="round"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {card.score != null ? card.score.toFixed(1) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 pr-10">
          <Icon className={`w-4 h-4 shrink-0 ${card.iconColor}`} aria-hidden />
          <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-700 dark:text-slate-300">
            {card.title}
          </h3>
        </div>
        {card.quickFix && (
          <div className="mt-2">
            <span className="inline-block bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-medium">
              Quick Fix
            </span>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">{card.quickFix}</p>
          </div>
        )}
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 list-disc list-inside pl-0.5">
          {listItems.length === 0 ? (
            <li>No specific feedback for this criterion.</li>
          ) : (
            listItems.map((entry, idx) => (
              <li
                key={entry.id || idx}
                ref={entry.id ? (el) => { cardRefs.current[entry.id] = el; } : undefined}
                className={entry.id === focusedId ? 'text-indigo-700 dark:text-indigo-300 font-medium' : ''}
              >
                {entry.text}
              </li>
            ))
          )}
        </ul>
      </>
    );
  };

  return (
    <div className="min-h-screen h-auto bg-[#f8fafc] dark:bg-slate-950 pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-6 space-y-8 min-h-screen h-auto">
        {/* Top: Back only */}
        <div className="flex items-center">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            My Archive
          </Link>
        </div>

        {/* Main: vertical stack on mobile (each block natural height), 2-col desktop; gap-8 between Essay and Feedback */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8 lg:items-stretch">
          {/* Left column: Essay + Lexical + Action Bar (Player + Downloads) */}
          <div className="flex flex-col gap-8">
            {/* Essay: full natural height, no max-h or overflow — entire text visible */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${check.type === 'TASK_1' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {check.type === 'TASK_1' ? 'Task 1' : 'Task 2'}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Red = Grammar · Blue = Vocabulary</p>
              </div>
              <div className="p-3 pb-12 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words font-[var(--font-geist-sans)]">
                {segments.map((seg, i) =>
                  seg.type ? (
                    <span
                      key={`${seg.id}-${i}`}
                      className={`cursor-pointer rounded px-0.5 ${underlineClass(seg.type)} hover:opacity-90`}
                      onClick={() => scrollToCard(seg.id)}
                      title={seg.suggestion}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </div>
            </div>

            {lexicalUpgrade.length > 0 && (
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-visible">
                <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-3 py-2 border-b border-slate-100 dark:border-slate-800">Lexical upgrade</h2>
                <div className="p-3 overflow-x-auto">
                  <table className="w-full min-w-[260px] text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                        <th className="pb-1 pr-2">B5–6</th>
                        <th className="pb-1">B8–9</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lexicalUpgrade.slice(0, 6).map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                          <td className="py-1 pr-2 text-slate-600 dark:text-slate-400 italic">{row.band_56_word}</td>
                          <td className="py-1 text-slate-800 dark:text-slate-200">{Array.isArray(row.band_89_synonyms) ? row.band_89_synonyms.join(', ') : row.band_89_synonyms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Bar: Audio Player and Download buttons in a stable, non-floating div directly below the essay */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-fit">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMp3}
                  disabled={!audioBlob || isAudioLoading}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:pointer-events-none ${isPlaying ? 'ring-1 ring-indigo-400/40' : ''}`}
                  title="Download MP3"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  MP3
                </button>
                <button
                  type="button"
                  onClick={() => downloadCheckReport(check)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em]"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  PDF
                </button>
              </div>
              {suggestedRewrite && (
                <div className="w-full lg:w-fit min-w-0">
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
              )}
            </div>
          </div>

          {/* Right column: Band score + Feedback grid */}
          <div className="flex flex-col gap-8">
            {/* Band score */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Band score</h2>
                <div className="relative h-12 w-12 shrink-0">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray={band != null ? `${(band / 9) * 100}, 100` : '0, 100'} strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-800 dark:text-slate-200">{band != null ? band.toFixed(1) : '—'}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { key: 'TA', value: ta, label: taskKey === 'Task_Achievement' ? 'TA' : 'TR' },
                  { key: 'CC', value: cc, label: 'CC' },
                  { key: 'LR', value: lr, label: 'LR' },
                  { key: 'GRA', value: gra, label: 'GRA' },
                ].map(({ key, value, label }) => (
                  <div key={key} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-2 text-center">
                    <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase">{label}</div>
                    <div className="mt-0.5 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{value != null ? value.toFixed(1) : '—'}</div>
                  </div>
                ))}
              </div>
              {feedback.improvement_strategy && (
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">{feedback.improvement_strategy}</p>
              )}
            </div>

            {/* Feedback: 3 cards same row height (items-stretch), no max-h or overflow — content grows naturally */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 lg:items-stretch">
              {feedbackCards.map((card) => {
                const isActive = card.items.some((it) => it.id === focusedId);
                return (
                  <div
                    key={card.key}
                    className={[
                      'relative flex flex-col min-h-[120px] h-full bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-100 dark:border-white/5 p-4 transition-all duration-200 hover:border-indigo-500/50 overflow-visible',
                      isActive ? 'border-indigo-500/50 ring-1 ring-indigo-400/20' : '',
                    ].join(' ')}
                  >
                    {renderFeedbackCardContent(card)}
                  </div>
                );
              })}
            </div>

            {/* Mobile/Tablet: Collapsible accordions for feedback */}
            <div className="lg:hidden space-y-1">
              {feedbackCards.map((card) => {
                const isOpen = accordionOpen === card.key;
                const isActive = card.items.some((it) => it.id === focusedId);
                return (
                  <div
                    key={card.key}
                    className={`rounded-xl border overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 ${isActive ? 'border-indigo-500/50' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setAccordionOpen(isOpen ? null : card.key)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
                    >
                      <span className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                        {card.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{card.score != null ? card.score.toFixed(1) : '—'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-white/5">
                        {card.quickFix && (
                          <div className="mt-2">
                            <span className="inline-block bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-medium">Quick Fix</span>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{card.quickFix}</p>
                          </div>
                        )}
                        <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside pl-0.5">
                          {[
                            ...(card.comment && typeof card.comment === 'string' ? card.comment.split(/\n+|\.\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 4) : []),
                            ...card.items.map((it) => (it.fixed ? `"${it.text}" → "${it.fixed}"` : (it.suggestion || `"${it.text}"`))),
                          ].slice(0, 8).map((entry, idx) => (
                            <li key={idx}>{entry}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
