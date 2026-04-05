'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

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

/**
 * Audio player state for SuggestedRewriteKaraoke (Band / TTS / waveform).
 */
export function useSuggestedRewriteAudio(suggestedRewrite, filenameBase) {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
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
    setIsAudioLoading(true);
    setAudioError('');
    try {
      const { blob } = await fetchTtsWithTimestamps({
        text: suggestedRewrite,
        filenameBase: filenameBase || 'Stratum_Rewrite',
      });
      const url = window.URL.createObjectURL(blob);
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
  }, [suggestedRewrite, filenameBase, isAudioLoading]);

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
    return () => {
      if (audioUrl) window.URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return {
    audioRef,
    audioUrl,
    audioDuration,
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
