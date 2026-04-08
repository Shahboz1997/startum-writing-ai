'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

function sanitizeTextForTts(input) {
  const s = String(input || '');
  if (!s) return '';
  return (
    s
      // remove mark tags (keeps inner text)
      .replace(/<\/?mark>/gi, '')
      // remove any other HTML-like tags (keeps inner text)
      .replace(/<\/?[^>]+>/g, '')
      // normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
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
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'TTS failed');
  }
  const data = await response.json();
  const blob = data.audioBase64 ? base64ToBlob(data.audioBase64) : null;
  const wordTimestamps = Array.isArray(data.wordTimestamps) ? data.wordTimestamps : [];
  return { blob, wordTimestamps };
}

/**
 * Audio player state for SuggestedRewriteKaraoke (Band / TTS / waveform).
 */
export function useSuggestedRewriteAudio(suggestedRewrite, filenameBase) {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [wordTimestamps, setWordTimestamps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);

  const formatTime = useCallback((s) => {
    const n = Number.isFinite(Number(s)) ? Math.max(0, Math.floor(s)) : 0;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }, []);

  const handleGenerateAudio = useCallback(async () => {
    if (!suggestedRewrite || isAudioLoading) return;
    const cleanText = sanitizeTextForTts(suggestedRewrite);
    if (!cleanText) return;
    setIsAudioLoading(true);
    setAudioError('');
    try {
      const { blob, wordTimestamps: ts } = await fetchTtsWithTimestamps({
        text: cleanText,
        filenameBase: filenameBase || 'Stratum_Rewrite',
      });
      const url = window.URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setWordTimestamps(Array.isArray(ts) ? ts : []);
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
  }, [suggestedRewrite, filenameBase, isAudioLoading]);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl || isAudioLoading) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } catch {
      // ignore (e.g. user gesture restriction)
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

  return {
    audioRef,
    audioUrl,
    audioDuration,
    wordTimestamps,
    isAudioLoading,
    isPlaying,
    audioProgress,
    audioTime,
    audioError,
    onGenerateAudio: handleGenerateAudio,
    onTogglePlay: handleTogglePlay,
    onSeek: handleSeek,
    formatTime,
  };
}
