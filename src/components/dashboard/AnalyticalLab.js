'use client';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Zap, BookOpen, GitBranch, ChevronDown } from 'lucide-react';
import { downloadCheckReport } from '@/lib/downloadReportPdf';
import SuggestedRewriteKaraoke from './SuggestedRewriteKaraoke';

const FEED_LABEL = { grammar: 'Grammar', lexical: 'Vocabulary', cohesion: 'Cohesion', logic: 'Logic' };

const ERROR_TYPE_HIGHLIGHT_CLASS = {
  grammar: 'bg-rose-100 dark:bg-rose-900/30 border-b-2 border-rose-500 text-rose-900 dark:text-rose-300 cursor-help',
  logic: 'bg-sky-100 dark:bg-sky-900/30 border-b-2 border-sky-500 text-sky-900 dark:text-sky-300 cursor-help',
  lexical: 'bg-purple-100 dark:bg-purple-900/30 border-b-2 border-purple-500 text-purple-900 dark:text-purple-300 cursor-help',
};

const ERROR_TYPE_BADGE_CLASS = {
  grammar: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/50',
  logic: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/50',
  lexical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/50',
};

const ERROR_TYPE_BADGE_LABEL = { grammar: 'Grammar', logic: 'Logic', lexical: 'Vocabulary' };

function normalizeClientErrorType(t) {
  const s = String(t || '')
    .toLowerCase()
    .trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (s === 'grammar' || s === 'logic' || s === 'lexical') return s;
  return 'grammar';
}

/** Main essay panel: map segments from buildSegmentsFromErrors to colored spans (IELTS error types). */
function renderHighlighterSpans(segments, { handleAutoFix, setUserText, scrollToErrorCard }) {
  return segments.map((seg, i) => {
    if (seg.kind !== 'error') {
      return <span key={`t-${i}`}>{seg.text}</span>;
    }
    const errType = normalizeClientErrorType(seg.errorType);
    const cls = ERROR_TYPE_HIGHLIGHT_CLASS[errType] || ERROR_TYPE_HIGHLIGHT_CLASS.grammar;
    const replacement = seg.fixed || seg.suggestion;
    const canReplace = Boolean(setUserText && replacement && String(replacement).trim() !== String(seg.text).trim());
    return (
      <span
        key={`${seg.id}-${i}`}
        className={`${cls} rounded px-0.5 transition-all duration-200 cursor-pointer hover:opacity-90`}
        role="button"
        tabIndex={0}
        onClick={() => {
          scrollToErrorCard(seg.id, seg.errorType);
          if (canReplace) {
            handleAutoFix(seg.text, replacement);
          }
        }}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            scrollToErrorCard(seg.id, seg.errorType);
            if (canReplace) {
              handleAutoFix(seg.text, replacement);
            }
          }
        }}
        title={seg.explanation || replacement || seg.suggestion || ''}
      >
        {seg.text}
      </span>
    );
  });
}

/** CEFR levels: bars and text use same palette. A1 slate, A2 emerald, B1 blue, B2 violet, C1 orange, C2 red. */
const CEFR_LEVELS = [
  { id: 'A1', label: 'A1', barBg: 'bg-slate-400' },
  { id: 'A2', label: 'A2', barBg: 'bg-emerald-500' },
  { id: 'B1', label: 'B1', barBg: 'bg-blue-500' },
  { id: 'B2', label: 'B2', barBg: 'bg-violet-500' },
  { id: 'C1', label: 'C1', barBg: 'bg-orange-500' },
  { id: 'C2', label: 'C2', barBg: 'bg-red-500' },
];

/** Hex colors for legend dots (synced with bars). */
const CEFR_COLORS = { A1: '#94a3b8', A2: '#10b981', B1: '#3b82f6', B2: '#8b5cf6', C1: '#f97316', C2: '#ef4444' };

/** Text color for CEFR word spans (matches bar palette, opacity-80). Errors override with bg-yellow-100 border. */
const CEFR_TEXT_CLASS = {
  // A1/A2 (Basic): gray
  A1: 'text-slate-400/80',
  A2: 'text-slate-400/80',
  // B1/B2 (Intermediate): blue / purple
  B1: 'text-blue-500/80',
  B2: 'text-violet-500/80',
  // C1/C2 (Advanced): orange / red
  C1: 'text-orange-500/80',
  C2: 'text-red-500/80',
};

const CEFR_LEVEL_LABELS = { A1: 'A1 - Beginner', A2: 'A2 - Elementary', B1: 'B1 - Intermediate', B2: 'B2 - Upper Intermediate', C1: 'C1 - Advanced', C2: 'C2 - Proficiency' };

const PLACEHOLDER_CEFR = { A1: 54, A2: 20, B1: 16, B2: 5, C1: 3, C2: 2 };

const RIGHT_PANEL_TABS = [
  { key: 'task', labelTask1: 'Task Achievement', labelTask2: 'Task Response' },
  { key: 'coherence', label: 'Coherence' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
];

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


/** Build map of lowercase word -> CEFR level from analysis.word_levels. */
function buildWordLevelsMap(wordLevels) {
  const map = new Map();
  if (!wordLevels) return map;
  if (Array.isArray(wordLevels)) {
    wordLevels.forEach((x) => {
      const word = (x?.word ?? x?.token ?? '').toString().toLowerCase().trim();
      const level = (x?.level ?? x?.cefr ?? '').toString().toUpperCase();
      if (word && level && CEFR_COLORS[level]) map.set(word, level);
    });
  } else if (typeof wordLevels === 'object') {
    Object.entries(wordLevels).forEach(([word, level]) => {
      const w = String(word).toLowerCase().trim();
      const l = String(level).toUpperCase();
      if (w && l && CEFR_COLORS[l]) map.set(w, l);
    });
  }
  return map;
}

/** Build set of lowercase words that are errors (from analysis.errors / corrections). */
function buildErrorWordsSet(errorsArray, corrections) {
  const set = new Set();
  const add = (str) => { if (str) String(str).toLowerCase().trim().split(/\s+/).forEach((w) => { const c = w.replace(/\W/g, ''); if (c) set.add(c); }); };
  (errorsArray || []).forEach((e) => add(typeof e === 'string' ? e : (e?.word ?? e?.original ?? e?.text ?? '')));
  (corrections || []).forEach((c) => add(c?.original));
  return set;
}

/**
 * Prompt:
 * "Refactor the text highlighting in the highlightRef layer to color-code words by their CEFR level:
 * Logic: Split userText into words. For each word, check its CEFR level from props.analysis.word_levels (or cefr_stats).
 * Colors: Wrap words in <span> with these Tailwind classes:
 * A1/A2 (Basic): text-slate-400 (Gray)
 * B1/B2 (Intermediate): text-blue-500 or text-violet-500 (Blue/Purple)
 * C1/C2 (Advanced): text-orange-500 or text-red-500 (Orange/Red)
 * Errors Priority: If a word exists in props.analysis.errors, ignore its CEFR color and apply bg-yellow-100 border-b-2 border-orange-400 instead.
 * Preserve Layout: Ensure spaces and line breaks (\n to <br/>) are preserved so the highlight layer perfectly matches the textarea text.
 * Styling: Use opacity-80 for CEFR colors so they don't distract too much from the errors."
 *
 * Renders userText with each word in a span: CEFR color from word_levels, or error style (bg-yellow-100 border) when in analysis.errors.
 */
function renderTextWithWordLevels(userText, wordLevelsMap, errorWordsSet, onErrorClick, weakWordsSet) {
  if (!userText || typeof userText !== 'string') return userText;
  const weakSet = weakWordsSet && weakWordsSet.size > 0 ? weakWordsSet : null;
  const tokens = userText.split(/(\b\w+\b)/);
  return tokens.map((token, i) => {
    if (!/^\w+$/.test(token)) return <span key={i}>{token}</span>;
    const key = `wl-${i}-${token}`;
    const normalized = token.toLowerCase();
    const level = wordLevelsMap.get(normalized);
    const isError = errorWordsSet.has(normalized);
    const isWeak = weakSet && weakSet.has(normalized);
    const title = level ? CEFR_LEVEL_LABELS[level] : undefined;
    const className = [
      'rounded px-0.5 cursor-pointer transition-colors',
      isError ? 'bg-yellow-100 border-b-2 border-orange-400 dark:bg-yellow-500/20 dark:border-orange-400' : isWeak ? 'bg-amber-100/80 dark:bg-amber-900/30 border-b-2 border-amber-400/70 dark:border-amber-500/50 text-amber-800/90 dark:text-amber-200/90' : (level && CEFR_TEXT_CLASS[level] ? `${CEFR_TEXT_CLASS[level]} hover:opacity-90` : ''),
    ].filter(Boolean).join(' ');
    return (
      <span
        key={key}
        className={className || undefined}
        title={title}
        onClick={isError && onErrorClick ? () => onErrorClick() : undefined}
      >
        {token}
      </span>
    );
  });
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

/** Build segments for center panel when using only errors (no word_levels): find error.original in content and wrap. */
function buildSegmentsFromErrors(content, errors) {
  if (!content || !Array.isArray(errors) || errors.length === 0) {
    return [{ kind: 'text', text: content || '' }];
  }
  const items = errors
    .map((e, i) => ({
      id: e.id ?? `error-${i}`,
      original: (e.original ?? e.word ?? e.text ?? '').toString().trim(),
      errorType: normalizeClientErrorType(e.type ?? e.category),
      suggestion: e.suggestion || e.fixed || '',
      explanation: e.explanation || e.impact || '',
      fixed: e.fixed || e.suggestion || '',
    }))
    .filter((e) => e.original);
  if (!items.length) return [{ kind: 'text', text: content }];
  const sorted = [...items].sort((a, b) => {
    const posA = content.toLowerCase().indexOf(a.original.toLowerCase());
    const posB = content.toLowerCase().indexOf(b.original.toLowerCase());
    if (posA === -1 && posB === -1) return 0;
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
  const segments = [];
  let lastEnd = 0;
  for (const it of sorted) {
    const pos = content.toLowerCase().indexOf(it.original.toLowerCase(), lastEnd);
    if (pos === -1) continue;
    if (pos > lastEnd) segments.push({ kind: 'text', text: content.slice(lastEnd, pos) });
    segments.push({
      kind: 'error',
      id: it.id,
      errorType: it.errorType,
      text: it.original,
      suggestion: it.suggestion,
      explanation: it.explanation,
      fixed: it.fixed,
    });
    lastEnd = pos + it.original.length;
  }
  if (lastEnd < content.length) segments.push({ kind: 'text', text: content.slice(lastEnd) });
  return segments.length ? segments : [{ kind: 'text', text: content }];
}

/** Normalize cefr_stats to { A1: pct, ... } (0–100). Use placeholder if missing. */
function normalizeCefrStats(cefrStats) {
  const out = { ...PLACEHOLDER_CEFR };
  if (cefrStats && typeof cefrStats === 'object') {
    if (Array.isArray(cefrStats)) {
      cefrStats.forEach((x) => {
        const id = (x?.level ?? x?.id ?? '').toString().toUpperCase();
        if (CEFR_LEVELS.some((l) => l.id === id)) out[id] = Math.min(100, Math.max(0, Number(x?.percent ?? x?.value ?? 0)));
      });
    } else {
      Object.entries(cefrStats).forEach(([k, v]) => {
        const id = String(k).toUpperCase();
        if (CEFR_LEVELS.some((l) => l.id === id)) out[id] = Math.min(100, Math.max(0, Number(v)));
      });
    }
  }
  CEFR_LEVELS.forEach((l) => { if (out[l.id] == null) out[l.id] = 0; });
  return out;
}

/**
 * AnalyticalLab — feedback view for a single check.
 * To enable Click-to-Fix (replace error with suggestion in the text), pass setUserText from the parent
 * (e.g. the Writer page or any page that owns editable userText state).
 */
export default function AnalyticalLab({ handleReplaceWord, ...props }) {
  const { check, analysis: analysisProp, userText: userTextProp, taskType: taskTypeProp, isLoading: isLoadingProp, setUserText } = props;
  const isLoading = Boolean(isLoadingProp);
  const feedback = useMemo(() => {
    const raw = analysisProp ?? check?.feedback;
    if (raw == null) return {};
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    } catch {
      return {};
    }
  }, [analysisProp, check?.feedback]);

  const userText = userTextProp ?? check?.content ?? '';
  const taskTypeRaw = check?.type ?? taskTypeProp;
  const taskTypeNormalized = (taskTypeRaw === 'TASK_1' || taskTypeRaw === 'task1') ? 'task1' : 'task2';
  const taskTypeForAudio = taskTypeNormalized === 'task1' ? 'TASK_1' : 'TASK_2';

  const [viewMode, setViewMode] = useState('feedback');
  const [rightPanelTab, setRightPanelTab] = useState('task');
  const [focusedId, setFocusedId] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const errorCardRefs = useRef({});
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const criteria = feedback.criteria || {};
  const taskKey = taskTypeNormalized === 'task1' ? 'Task_Achievement' : 'Task_Response';
  const ta = criteria[taskKey]?.score ?? 0;
  const cc = criteria.Coherence_and_Cohesion?.score ?? 0;
  const lr = criteria.Lexical_Resource?.score ?? 0;
  const gra = criteria.Grammatical_Range_and_Accuracy?.score ?? 0;
  const band = feedback.overall_band != null ? Number(feedback.overall_band) : null;

  const highlights = Array.isArray(feedback.highlights) ? feedback.highlights : [];
  const corrections = Array.isArray(feedback.corrections) ? feedback.corrections : [];
  const errors = useMemo(() => {
    const raw =
      Array.isArray(feedback.errors) && feedback.errors.length > 0 ? feedback.errors : corrections;
    return raw.map((e, i) => {
      const type = normalizeClientErrorType(e.type ?? e.category);
      const fixed = String(e.fixed ?? '').trim();
      const suggest = String(e.suggestion ?? '').trim();
      const replacement = fixed || suggest;
      return {
        id: e.id ?? `error-${i}`,
        type,
        original: e.original ?? e.word ?? e.text ?? '',
        fixed: replacement,
        suggestion: replacement,
        explanation: String(e.explanation ?? e.impact ?? '').trim(),
      };
    });
  }, [feedback.errors, corrections]);
  const lexicalUpgrade = Array.isArray(feedback.lexical_upgrade) ? feedback.lexical_upgrade : [];
  const suggestedRewrite = feedback.suggested_rewrite || '';
  const audioRef = useRef(null);
  const audioFilenameBase = getAudioFilenameBase(taskTypeForAudio);
  const audioDownloadName = `${audioFilenameBase}.mp3`;
  const segments = useMemo(
    () => buildSegments(userText, highlights, corrections),
    [userText, highlights, corrections]
  );
  const errorSegments = useMemo(
    () => buildSegmentsFromErrors(userText, errors),
    [userText, errors]
  );
  const cefrStats = useMemo(() => normalizeCefrStats(feedback.cefr_stats), [feedback.cefr_stats]);

  const wordLevelsMap = useMemo(() => buildWordLevelsMap(feedback.word_levels), [feedback.word_levels]);
  const errorWordsSet = useMemo(() => buildErrorWordsSet(feedback.errors, corrections), [feedback.errors, corrections]);
  const weakWordsSet = useMemo(() => {
    const set = new Set();
    (lexicalUpgrade || []).forEach((row) => {
      const w = (row.band_56_word || '').toString().toLowerCase().trim().replace(/[.,!?;:()]/g, '');
      if (w) set.add(w);
    });
    return set;
  }, [lexicalUpgrade]);
  const useTypedErrorHighlight = viewMode === 'feedback' && errors.length > 0;
  const useWordLevelRendering =
    viewMode === 'feedback' && wordLevelsMap && wordLevelsMap.size > 0 && !useTypedErrorHighlight;

  const formatTime = useCallback((seconds) => {
    const s = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(seconds)) : 0;
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const feedItems = useMemo(() => {
    const fromErrors = errors.map((e) => ({
      id: e.id,
      type: e.type,
      label: ERROR_TYPE_BADGE_LABEL[e.type] || FEED_LABEL[e.type] || e.type,
      text: e.original,
      suggestion: e.explanation,
      fixed: e.fixed,
      impact: 'medium',
      kind: 'error',
    }));
    if (fromErrors.length > 0) return fromErrors;
    const list = [];
    highlights.forEach((h, i) =>
      list.push({
        id: `h-${i}`,
        type: normalizeClientErrorType(h.type),
        label: FEED_LABEL[h.type] || h.type,
        text: h.text,
        suggestion: h.suggestion,
        kind: 'highlight',
      })
    );
    corrections.forEach((c, i) => {
      const type = normalizeClientErrorType(c.category);
      list.push({
        id: `c-${i}`,
        type,
        label: c.category || ERROR_TYPE_BADGE_LABEL[type],
        text: c.original,
        suggestion: c.explanation,
        fixed: c.fixed,
        impact: c.impact,
        kind: 'correction',
      });
    });
    return list;
  }, [errors, highlights, corrections]);

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
    const cohesionItems = feedItems.filter((i) => i.type === 'cohesion' || i.type === 'logic');
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

  /** Click-to-Fix: replace first occurrence of error with suggestion. Only runs in Feedback mode when setUserText is passed. */
  const handleAutoFix = useCallback((original, replacement) => {
    if (viewMode !== 'feedback') return;
    if (!setUserText || !replacement) return;
    const current = userText;
    if (!current || typeof original !== 'string') return;
    const newText = current.replace(original, replacement);
    if (newText !== current) setUserText(newText);
  }, [viewMode, setUserText, userText]);

  /** Use parent's handleReplaceWord when provided, else fallback to handleAutoFix (2-arg). */
  const onReplaceWord = useCallback((original, fixed, occurrenceIndex, idx) => {
    if (handleReplaceWord) {
      handleReplaceWord(original, fixed, occurrenceIndex ?? 1, idx);
      return;
    }
    handleAutoFix(original, fixed);
  }, [handleReplaceWord, handleAutoFix]);

  /** Одним кликом заменить первое вхождение каждого слабого слова на первый синоним. */
  const handleApplyAllUpgrades = useCallback(() => {
    if (!setUserText || !lexicalUpgrade.length) return;
    const entries = lexicalUpgrade
      .map((row) => {
        const w = (row.band_56_word || '').trim();
        const syns = Array.isArray(row.band_89_synonyms) ? row.band_89_synonyms : (row.band_89_synonyms ? String(row.band_89_synonyms).split(',').map((s) => s.trim()) : []);
        const first = syns[0]?.trim();
        return w && first ? { weakWord: w, firstSyn: first } : null;
      })
      .filter(Boolean);
    if (entries.length === 0) return;
    const lower = userText.toLowerCase();
    const replacements = entries
      .map(({ weakWord, firstSyn }) => {
        const idx = lower.indexOf(weakWord.toLowerCase());
        return idx === -1 ? null : { idx, weakWord, firstSyn, len: weakWord.length };
      })
      .filter(Boolean);
    replacements.sort((a, b) => b.idx - a.idx);
    let result = userText;
    replacements.forEach(({ idx, firstSyn, len }) => {
      result = result.slice(0, idx) + firstSyn + result.slice(idx + len);
    });
    setUserText(result);
  }, [setUserText, userText, lexicalUpgrade]);

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

  /** Open the tab that lists this error and scroll the main page so the matching card is in view. */
  const scrollToErrorCard = useCallback((errorId, errorType) => {
    if (errorId == null) return;
    const type = normalizeClientErrorType(errorType);
    setRightPanelTab(type === 'grammar' ? 'grammar' : 'vocabulary');
    setFocusedId(errorId);
    const runScroll = () => {
      const el = errorCardRefs.current[errorId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(runScroll);
    });
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

  if (isLoading || (!check && !analysisProp)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 lg:pb-12" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="flex flex-col gap-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow lg:w-3/5 space-y-4">
              <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-8 shadow-sm animate-pulse">
                <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full lg:w-[400px]">
              <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 shadow-sm animate-pulse">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 lg:pb-12" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 items-start">
        {/* Center: Main Content — Your Answer + Lexical + Action Bar */}
        <div className="flex-grow w-full lg:w-3/5 order-2 lg:order-1 flex flex-col gap-8 min-w-0">
          <div className="flex items-center">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              My Archive
            </Link>
          </div>
          {/* Your Answer — header + toggle + legend + text */}
          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-slate-900 dark:text-white font-bold tracking-tight text-xl">Your Answer</h2>
              <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('feedback')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === 'feedback' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Feedback
                </button>
              </div>
            </div>
            <div className="text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap break-words transition-all duration-200" spellCheck={false}>
              {viewMode === 'original'
                ? userText
                : useWordLevelRendering
                  ? renderTextWithWordLevels(userText, wordLevelsMap, errorWordsSet, () => setRightPanelTab('vocabulary'), weakWordsSet)
                  : renderHighlighterSpans(errorSegments, {
                      handleAutoFix,
                      setUserText,
                      scrollToErrorCard,
                    })}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs dark:bg-indigo-500/10 dark:text-indigo-300" aria-hidden>
                  🪄
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Lexical upgrade
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Swap weak words for sharper choices
                  </span>
                </div>
              </div>
              {lexicalUpgrade.length > 0 && setUserText && (
                <button
                  type="button"
                  onClick={handleApplyAllUpgrades}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm border border-amber-400/50 transition-colors"
                  title="Заменить первое вхождение каждого слабого слова на первый синоним"
                >
                  <span aria-hidden>🪄</span>
                  Применить все улучшения
                </button>
              )}
            </div>
            <div className="p-3 sm:p-4">
              {lexicalUpgrade.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic py-4 text-center">
                  No upgrades needed yet. Use more academic language to see suggestions.
                </p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {lexicalUpgrade.map((row, i) => {
                    const weakWord = row.band_56_word;
                    const synonymsRaw = Array.isArray(row.band_89_synonyms)
                      ? row.band_89_synonyms
                      : (row.band_89_synonyms ? String(row.band_89_synonyms).split(',') : []);
                    const synonyms = synonymsRaw.map((s) => s.trim()).filter(Boolean);

                    if (!weakWord || synonyms.length === 0) return null;

                    return (
                      <div
                        key={`${weakWord}-${i}`}
                        className="flex flex-col gap-1.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/60 px-2.5 py-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium shrink-0">
                            B5–6
                          </span>
                          <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-100 italic">
                            {weakWord}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {synonyms.map((syn, idx) => (
                            <button
                              key={`${weakWord}-${syn}-${idx}`}
                              type="button"
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20 transition-colors"
                              onClick={() => onReplaceWord(weakWord, syn, 1, i)}
                              title={`Replace "${weakWord}" with "${syn}" in your essay`}
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-fit">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadMp3}
                disabled={!audioBlob || isAudioLoading}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:pointer-events-none transition-colors ${isPlaying ? 'ring-1 ring-indigo-400/40' : ''}`}
                title="Download MP3"
              >
                <Download className="w-4 h-4 shrink-0" />
                MP3
              </button>
              <button
                type="button"
                onClick={() => check && downloadCheckReport(check)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4 shrink-0" />
                PDF
              </button>
            </div>
            {suggestedRewrite && (
              <div className="w-full lg:w-fit min-w-0">
                <SuggestedRewriteKaraoke
                  bandScore={band != null ? String(band) : undefined}
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

        {/* Right: Detailed Analytics Panel — Band, pill tabs, CEFR bars, errors */}
        <div className="flex flex-col gap-6 w-full lg:w-[400px] lg:sticky lg:top-24 lg:self-start order-1 lg:order-2">
          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Band score</h2>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" className="dark:stroke-slate-700" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray={band != null ? `${(band / 9) * 100}, 100` : '0, 100'} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white tracking-tight">{band != null ? band.toFixed(1) : '—'}</span>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'TA', value: ta, label: taskKey === 'Task_Achievement' ? 'TA' : 'TR' },
                  { key: 'CC', value: cc, label: 'CC' },
                  { key: 'LR', value: lr, label: 'LR' },
                  { key: 'GRA', value: gra, label: 'GRA' },
                ].map(({ key, value, label }) => (
                  <div key={key}>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-0.5">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value != null ? value.toFixed(1) : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            {feedback.improvement_strategy && (
              <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{feedback.improvement_strategy}</p>
            )}
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              {RIGHT_PANEL_TABS.map((tab) => {
                const label = tab.key === 'task' ? (taskTypeNormalized === 'task1' ? tab.labelTask1 : tab.labelTask2) : tab.label;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRightPanelTab(tab.key)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${rightPanelTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              {rightPanelTab === 'task' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{taskTypeNormalized === 'task1' ? 'Task Achievement' : 'Task Response'}</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{ta != null ? ta.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria[taskKey]?.comment || 'No specific feedback for this criterion.'}</p>
                </div>
              )}
              {rightPanelTab === 'coherence' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Coherence & Cohesion</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cc != null ? cc.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Coherence_and_Cohesion?.comment || 'No specific feedback for this criterion.'}</p>
                </div>
              )}
              {rightPanelTab === 'vocabulary' && (
                <div className="space-y-4">
                  {errors.length > 0 && (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
      Errors & corrections
    </h3>
    {errors.map((err, idx) => {
      const applyText = err.fixed || err.suggestion;
      const canApply =
        applyText &&
        String(applyText).trim().length > 0 &&
        String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
      const badgeCls = ERROR_TYPE_BADGE_CLASS[err.type] || ERROR_TYPE_BADGE_CLASS.grammar;
      const badgeLabel = ERROR_TYPE_BADGE_LABEL[err.type] || err.type;
      return (
      <div
        key={err.id || idx}
        ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
        className="group relative rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-300"
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}>
            {badgeLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium break-words">
              {err.original}
            </span>
            <span className="text-slate-400 shrink-0" aria-hidden>→</span>
            {canApply ? (
              <button
                type="button"
                onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-500/20 text-left break-words"
                title="Click to apply this fix"
              >
                {applyText}
              </button>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                No one-click fix — revise using the explanation below.
              </span>
            )}
          </div>

          {canApply && (
            <button
              type="button"
              onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              <svg xmlns="http://www.w3.org" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Apply
            </button>
          )}
        </div>

        {err.explanation ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            <span className={`font-bold ${err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
              Why?
            </span>{' '}
            <span
              className={`font-semibold ${
                err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
              }`}
            >
              {err.type === 'logic' ? '⚠️ ' : null}
              {err.explanation}
            </span>
          </p>
        ) : null}
      </div>
    );
    })}
  </div>
)}    
 </div>
              )}
              {rightPanelTab === 'grammar' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammatical Range & Accuracy</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{gra != null ? gra.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Grammatical_Range_and_Accuracy?.comment || 'No specific feedback for this criterion.'}</p>
                  {errors.some((e) => e.type === 'grammar') && (
                    <div className="space-y-3 mt-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammar corrections</h3>
                      {errors.filter((e) => e.type === 'grammar').map((err, idx) => {
                        const applyText = err.fixed || err.suggestion;
                        const canApply =
                          applyText &&
                          String(applyText).trim().length > 0 &&
                          String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
                        const badgeCls = ERROR_TYPE_BADGE_CLASS.grammar;
                        return (
                        <div
                          key={err.id}
                          ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
                          className="rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5"
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${badgeCls}`}>
                            Grammar
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium">{err.original}</span>
                            <span className="text-slate-400" aria-hidden>→</span>
                            {canApply ? (
                              <button
                                type="button"
                                onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                                className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline text-left"
                              >
                                {applyText}
                              </button>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                            )}
                          </div>
                          {err.explanation ? (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              <span
                                className={`font-semibold ${
                                  err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                Why?
                              </span>{' '}
                              <span
                                className={`font-semibold ${
                                  err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
                                }`}
                              >
                                {err.type === 'logic' ? '⚠️ ' : null}
                                {err.explanation}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
