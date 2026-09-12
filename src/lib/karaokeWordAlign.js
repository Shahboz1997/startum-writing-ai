/** Normalize token for matching display text ↔ Whisper output. */
export function normalizeWordToken(w) {
  return String(w || '')
    .replace(/^[.,!?;:'"()[\]]+|[.,!?;:'"()[\]]+$/g, '')
    .toLowerCase();
}

export function tokenizePlainText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Greedy sequential align: each display word → next matching Whisper token.
 * Uses real start/end from Whisper (actual voicing), interpolates only unmatched gaps.
 * @param {string[]} inputTokens
 * @param {{word:string,start:number,end:number}[]} whisperWords
 * @param {{ totalDuration?: number }} [options]
 */
export function alignTextTokensToWhisper(inputTokens, whisperWords, options = {}) {
  const n = inputTokens.length;
  const m = whisperWords.length;
  if (n === 0 || m === 0) return [];

  const totalDuration = Number(options.totalDuration);
  const whisperIdxForToken = new Array(n).fill(null);
  let wi = 0;
  const SEARCH_WINDOW = 10;

  for (let ti = 0; ti < n; ti++) {
    const target = normalizeWordToken(inputTokens[ti]);
    if (!target) continue;

    let found = -1;
    for (let w = wi; w < Math.min(wi + SEARCH_WINDOW, m); w++) {
      if (normalizeWordToken(whisperWords[w]?.word) === target) {
        found = w;
        break;
      }
    }
    // Year soft-match: display "1990" vs Whisper split "1000," + "990,"
    if (found < 0 && /^\d+$/.test(target)) {
      for (let w = wi; w < Math.min(wi + SEARCH_WINDOW, m - 1); w++) {
        const a = normalizeWordToken(whisperWords[w]?.word);
        const b = normalizeWordToken(whisperWords[w + 1]?.word);
        if (/^\d+$/.test(a) && /^\d+$/.test(b) && a + b === target) {
          found = w;
          break;
        }
      }
    }
    if (found >= 0) {
      whisperIdxForToken[ti] = found;
      const targetNorm = normalizeWordToken(inputTokens[ti]);
      const a = normalizeWordToken(whisperWords[found]?.word);
      const b = normalizeWordToken(whisperWords[found + 1]?.word);
      if (/^\d+$/.test(targetNorm) && /^\d+$/.test(a) && /^\d+$/.test(b) && a + b === targetNorm) {
        wi = found + 2;
      } else {
        wi = found + 1;
      }
    }
  }

  const matchedCount = whisperIdxForToken.filter((x) => x !== null).length;
  if (matchedCount < Math.max(3, Math.floor(n * 0.25))) {
    return mapProportionalTimings(inputTokens, whisperWords);
  }

  const aligned = new Array(n).fill(null);
  for (let ti = 0; ti < n; ti++) {
    const wj = whisperIdxForToken[ti];
    if (wj === null) continue;
    const start = Number(whisperWords[wj]?.start);
    let end = Number(whisperWords[wj]?.end);
    const target = normalizeWordToken(inputTokens[ti]);
    if (/^\d+$/.test(target)) {
      const a = normalizeWordToken(whisperWords[wj]?.word);
      const b = normalizeWordToken(whisperWords[wj + 1]?.word);
      if (/^\d+$/.test(a) && /^\d+$/.test(b) && a + b === target) {
        end = Number(whisperWords[wj + 1]?.end);
      }
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    aligned[ti] = { word: inputTokens[ti], start, end };
  }

  const matchedIdx = [];
  for (let i = 0; i < n; i++) if (aligned[i]) matchedIdx.push(i);
  if (matchedIdx.length === 0) return mapProportionalTimings(inputTokens, whisperWords);

  for (let mi = 0; mi < matchedIdx.length - 1; mi++) {
    const a = matchedIdx[mi];
    const b = matchedIdx[mi + 1];
    const gap = b - a - 1;
    if (gap <= 0) continue;
    const left = aligned[a];
    const right = aligned[b];
    const t0 = left.end;
    const t1 = right.start;
    if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) continue;
    const step = (t1 - t0) / (gap + 1);
    for (let k = 1; k <= gap; k++) {
      const idx = a + k;
      aligned[idx] = {
        word: inputTokens[idx],
        start: t0 + step * (k - 1),
        end: t0 + step * k,
      };
    }
  }

  const first = matchedIdx[0];
  if (first > 0) {
    const right = aligned[first];
    const span = Math.max(0.06, right.end - right.start || 0.15);
    const step = span / (first + 1);
    for (let i = first - 1; i >= 0; i--) {
      const e = right.start - step * (first - i);
      const s = e - step;
      aligned[i] = { word: inputTokens[i], start: Math.max(0, s), end: Math.max(0, e) };
    }
  }

  const last = matchedIdx[matchedIdx.length - 1];
  if (last < n - 1) {
    const left = aligned[last];
    const remaining = n - last;
    const endBound =
      Number.isFinite(totalDuration) && totalDuration > left.end + 0.05
        ? totalDuration
        : left.end + Math.max(0.06, left.end - left.start || 0.15) * remaining;
    const step = (endBound - left.end) / remaining;
    let cur = left.end;
    for (let i = last + 1; i < n; i++) {
      aligned[i] = { word: inputTokens[i], start: cur, end: cur + step };
      cur += step;
    }
  }

  if (aligned.some((x) => !x)) return mapProportionalTimings(inputTokens, whisperWords);
  return aligned;
}

/** Fallback: map each display word to a slice of Whisper timeline by index ratio. */
export function mapProportionalTimings(inputTokens, whisperWords) {
  const n = inputTokens.length;
  const m = whisperWords.length;
  if (n === 0 || m === 0) return [];
  if (Math.abs(n - m) / Math.max(n, m) > 0.25) return [];

  const result = [];
  for (let i = 0; i < n; i++) {
    const j0 = Math.floor((i * m) / n);
    const j1 = Math.min(m - 1, Math.max(j0, Math.floor(((i + 1) * m) / n) - 1));
    const start = Number(whisperWords[j0]?.start);
    const end = Number(whisperWords[j1]?.end ?? whisperWords[j0]?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    result.push({ word: inputTokens[i], start, end });
  }
  return result;
}

/** Active word for karaoke. A small lag keeps the highlight from racing ahead of speech. */
export const KARAOKE_HIGHLIGHT_LAG_SEC = 0.22;

/**
 * Stretch/compress Whisper timings so the last word ends with the real audio file.
 * Without this, truncated aligners finish the highlight while audio is still playing.
 */
export function scaleTimingsToAudioDuration(timings, audioDuration) {
  if (!Array.isArray(timings) || timings.length === 0) return timings;
  if (!Number.isFinite(audioDuration) || audioDuration <= 0.2) return timings;

  const lastEnd = Number(timings[timings.length - 1]?.end);
  if (!Number.isFinite(lastEnd) || lastEnd <= 0.05) return timings;

  const drift = audioDuration - lastEnd;
  // Ignore tiny drift; only rescale when highlight would clearly lead or lag the file.
  if (Math.abs(drift) < 0.35) return timings;

  const scale = audioDuration / lastEnd;
  if (!Number.isFinite(scale) || scale <= 0) return timings;

  return timings.map((t) => {
    const start = Math.max(0, Number(t.start) * scale);
    let end = Math.max(start + 0.04, Number(t.end) * scale);
    if (end > audioDuration) end = audioDuration;
    return { ...t, start, end };
  });
}

/** Active word = whose [start, end) contains (audio currentTime − lag). */
export function findActiveWordIndexFromTimings(
  timings,
  currentSec,
  lagSec = KARAOKE_HIGHLIGHT_LAG_SEC
) {
  if (!timings?.length || !Number.isFinite(currentSec)) return -1;

  const t = Math.max(0, currentSec - (Number.isFinite(lagSec) ? Math.max(0, lagSec) : 0));

  for (let i = 0; i < timings.length; i++) {
    const start = Number(timings[i].start);
    const end = Number(timings[i].end);
    if (t >= start && t < end) return i;
  }

  // In gaps between words, keep the previous word (do not jump ahead).
  for (let i = timings.length - 1; i >= 0; i--) {
    if (t >= Number(timings[i].start)) return i;
  }
  return -1;
}
