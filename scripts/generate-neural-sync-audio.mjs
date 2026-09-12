/**
 * One-shot generator for landing Neural Sync karaoke assets.
 *
 * Prefer Replicate MiniMax TTS (REPLICATE_API_TOKEN). Falls back to OpenAI tts-1
 * when the Replicate token is missing so local demos still ship.
 * Always aligns word timestamps with OpenAI Whisper (OPENAI_API_KEY).
 *
 * Usage:
 *   npm run demo:neural-sync-audio
 *   npm run demo:neural-sync-audio -- --align-only   # Whisper-resync existing mp3/wav
 *
 * Token: https://replicate.com/account/api-tokens → REPLICATE_API_TOKEN in .env.local
 *
 * Writes:
 *   public/demo/neural-sync.mp3
 *   public/demo/neural-sync-timings.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI, { toFile } from 'openai';
import {
  alignTextTokensToWhisper,
  tokenizePlainText,
} from '../src/lib/karaokeWordAlign.js';
import { NEURAL_SYNC_SAMPLE_TEXT } from '../src/lib/neuralSyncSample.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'demo');
const mp3Path = path.join(outDir, 'neural-sync.mp3');
const jsonPath = path.join(outDir, 'neural-sync-timings.json');

const REPLICATE_MODEL = 'minimax/speech-2.8-turbo';
const POLL_MS = 2000;
const MAX_WAIT_MS = 120_000;

function parseEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnv() {
  const local = parseEnv(path.join(root, '.env.local'));
  const base = parseEnv(path.join(root, '.env'));
  return { ...base, ...local, ...process.env };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveOutputUrl(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
  if (typeof output === 'object' && typeof output.url === 'string') return output.url;
  return null;
}

async function createReplicatePrediction(token, input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({ input }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail || body?.error || res.statusText;
    throw new Error(`Replicate create failed (${res.status}): ${detail}`);
  }
  return body;
}

async function getPrediction(token, id) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Replicate poll failed (${res.status}): ${body?.detail || res.statusText}`);
  }
  return body;
}

async function waitForPrediction(token, prediction) {
  let current = prediction;
  const started = Date.now();
  while (current.status !== 'succeeded' && current.status !== 'failed' && current.status !== 'canceled') {
    if (Date.now() - started > MAX_WAIT_MS) {
      throw new Error(`Replicate prediction timed out after ${MAX_WAIT_MS}ms (status=${current.status})`);
    }
    await sleep(POLL_MS);
    current = await getPrediction(token, current.id);
    process.stdout.write(`\rReplicate status: ${current.status}   `);
  }
  process.stdout.write('\n');
  if (current.status !== 'succeeded') {
    throw new Error(`Replicate prediction ${current.status}: ${current.error || 'unknown error'}`);
  }
  return current;
}

async function synthesizeWithReplicate(token, text) {
  console.log(`TTS via Replicate ${REPLICATE_MODEL}…`);
  const prediction = await createReplicatePrediction(token, {
    text,
    voice_id: process.env.REPLICATE_TTS_VOICE || 'English_Wiselady',
    speed: Number(process.env.REPLICATE_TTS_SPEED) || 0.94,
    volume: 1,
    pitch: 0,
    emotion: 'neutral',
    audio_format: 'mp3',
    sample_rate: 32000,
    bitrate: 128000,
    channel: 'mono',
    language_boost: 'English',
    english_normalization: true,
  });

  const done =
    prediction.status === 'succeeded'
      ? prediction
      : await waitForPrediction(token, prediction);

  const url = resolveOutputUrl(done.output);
  if (!url) throw new Error('Replicate returned no audio URL in output');

  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Failed to download Replicate audio (${audioRes.status})`);
  return Buffer.from(await audioRes.arrayBuffer());
}

async function synthesizeWithOpenAI(openai, text) {
  const ttsModel = (process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts').trim();
  console.log(`TTS via OpenAI ${ttsModel}…`);
  const mp3 = await openai.audio.speech.create({
    model: ttsModel,
    voice: 'alloy',
    input: text,
  });
  return Buffer.from(await mp3.arrayBuffer());
}

function wavDurationSeconds(buf) {
  if (!buf || buf.length < 44) return 0;
  const byteRate = buf.readUInt32LE(28);
  if (!byteRate) return 0;
  return (buf.length - 44) / byteRate;
}

/** Best-effort MP3 duration via Windows MediaPlayer (dev machine). */
async function probeMp3DurationSeconds(filePath) {
  if (process.platform !== 'win32' || !fs.existsSync(filePath)) return 0;
  const { spawnSync } = await import('child_process');
  const ps = `
Add-Type -AssemblyName PresentationCore
$p = New-Object System.Windows.Media.MediaPlayer
$opened = \$false
\$p.add_MediaOpened({ \$opened = \$true })
\$p.Open([Uri]${JSON.stringify(filePath)})
\$deadline = (Get-Date).AddSeconds(8)
while (-not \$opened -and (Get-Date) -lt \$deadline) { Start-Sleep -Milliseconds 50 }
\$dur = if (\$p.NaturalDuration.HasTimeSpan) { \$p.NaturalDuration.TimeSpan.TotalSeconds } else { 0 }
\$p.Close()
Write-Output \$dur
`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    encoding: 'utf8',
  });
  const n = Number(String(result.stdout || '').trim().split(/\r?\n/).pop());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Last-resort local TTS on Windows when cloud keys are missing/invalid. */
async function synthesizeWithWindowsSapi(text) {
  if (process.platform !== 'win32') {
    throw new Error('Windows SAPI fallback is only available on win32.');
  }
  console.log('TTS via Windows SAPI (cloud TTS unavailable)…');
  const wavPath = path.join(outDir, 'neural-sync.wav');
  fs.mkdirSync(outDir, { recursive: true });
  const ps = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = -1
$synth.Volume = 100
$en = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo } | Where-Object { $_.Culture.Name -like 'en*' } | Select-Object -First 1
if ($en) { $synth.SelectVoice($en.Name) }
$synth.SetOutputToWaveFile(${JSON.stringify(wavPath)})
$synth.Speak(${JSON.stringify(text)})
$synth.Dispose()
`;
  const { spawnSync } = await import('child_process');
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(`Windows SAPI failed: ${result.stderr || result.stdout || result.status}`);
  }
  if (!fs.existsSync(wavPath)) throw new Error('Windows SAPI did not write neural-sync.wav');
  return fs.readFileSync(wavPath);
}

function proportionalWordTimings(text, duration) {
  const words = tokenizePlainText(text);
  if (words.length === 0 || !Number.isFinite(duration) || duration <= 0) return [];
  const multipliers = words.map((w) => {
    const last = w.slice(-1);
    if (last === '.' || last === '?') return 1.4;
    if (last === ',') return 1.2;
    return 1;
  });
  const totalMultipliers = multipliers.reduce((a, b) => a + b, 0);
  const baseUnit = duration / totalMultipliers;
  const result = [];
  let start = 0;
  for (let i = 0; i < words.length; i++) {
    const d = baseUnit * multipliers[i];
    const end = i === words.length - 1 ? duration : start + d;
    result.push({
      word: words[i],
      start: Number(start.toFixed(4)),
      end: Number(end.toFixed(4)),
    });
    start = end;
  }
  return result;
}

function finalizeAlignedWords(inputTokens, whisperWords, reportedDuration = 0) {
  const durationHint =
    (Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : 0) ||
    (whisperWords.length > 0 ? Number(whisperWords[whisperWords.length - 1].end) : 0);

  let words = [];
  if (whisperWords.length > 0) {
    const aligned = alignTextTokensToWhisper(inputTokens, whisperWords, {
      totalDuration: durationHint,
    });
    words =
      aligned.length > 0
        ? aligned
        : whisperWords.map((w) => ({
            word: w.word,
            start: Number(w.start),
            end: Number(w.end),
          }));
  }

  const duration =
    (Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : 0) ||
    (words.length > 0 ? Number(words[words.length - 1].end) : 0);

  if (words.length > 0 && Number.isFinite(duration) && duration > 0) {
    const last = words[words.length - 1];
    if (Number.isFinite(last.end) && last.end < duration && duration - last.end <= 2) {
      words = words.map((w, i) => (i === words.length - 1 ? { ...w, end: duration } : w));
    }
  }

  // Reject crushed alignments (e.g. Whisper truncated to one sentence).
  if (words.length > 8) {
    const span = Number(words[words.length - 1].end) - Number(words[0].start);
    const median =
      [...words]
        .map((w) => Number(w.end) - Number(w.start))
        .sort((a, b) => a - b)[Math.floor(words.length / 2)] || 0;
    if (span > 0 && median > 0 && median < 0.04 && whisperWords.length < inputTokens.length * 0.5) {
      throw new Error(
        `Whisper alignment looks truncated (${whisperWords.length} words → crushed karaoke span ${span.toFixed(2)}s).`
      );
    }
  }

  return {
    words,
    duration: Number.isFinite(duration) ? duration : 0,
    whisperWordCount: whisperWords.length,
  };
}

async function alignWithWhisper(openai, text, audioBuffer, fileName = 'neural-sync.mp3') {
  console.log('Aligning word timestamps with OpenAI Whisper…');
  const mime =
    fileName.endsWith('.wav') ? 'audio/wav' : fileName.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';
  const audioFile = await toFile(audioBuffer, fileName, { type: mime });
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    prompt: text.slice(0, 800),
  });

  const whisperWords = (transcription?.words || []).map((w) => ({
    word: w.word,
    start: Number(w.start),
    end: Number(w.end),
  }));

  if (whisperWords.length === 0) {
    throw new Error(
      'Whisper returned no word timestamps (check model supports timestamp_granularities=word).'
    );
  }

  console.log(`OpenAI Whisper returned ${whisperWords.length} word timestamps.`);
  return finalizeAlignedWords(
    tokenizePlainText(text),
    whisperWords,
    Number(transcription?.duration)
  );
}

const WHISPERX_MODEL = 'victor-upmeet/whisperx';

function extractWhisperXWords(output) {
  const segments = Array.isArray(output?.segments)
    ? output.segments
    : Array.isArray(output)
      ? output
      : [];
  const words = [];
  for (const seg of segments) {
    const segWords = Array.isArray(seg?.words) ? seg.words : [];
    for (const w of segWords) {
      const start = Number(w?.start ?? w?.start_time);
      const end = Number(w?.end ?? w?.end_time);
      const token = String(w?.word ?? w?.text ?? '').trim();
      if (!token || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      words.push({ word: token, start, end });
    }
  }
  return words;
}

async function uploadReplicateFile(token, audioBuffer, fileName) {
  const mime = fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
  const form = new FormData();
  form.append('content', new Blob([audioBuffer], { type: mime }), fileName);
  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Replicate file upload failed (${res.status}): ${body?.detail || body?.error || res.statusText}`);
  }
  const url = body?.urls?.get || body?.url;
  if (!url) throw new Error('Replicate file upload returned no URL');
  return url;
}

async function alignWithReplicateWhisperX(token, text, audioBuffer, fileName = 'neural-sync.mp3') {
  console.log(`Aligning word timestamps with Replicate ${WHISPERX_MODEL}…`);
  const audioUrl = await uploadReplicateFile(token, audioBuffer, fileName);

  const modelRes = await fetch(`https://api.replicate.com/v1/models/${WHISPERX_MODEL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const model = await modelRes.json().catch(() => ({}));
  if (!modelRes.ok) {
    throw new Error(`WhisperX model lookup failed (${modelRes.status}): ${model?.detail || modelRes.statusText}`);
  }
  const version = model?.latest_version?.id;
  if (!version) throw new Error('WhisperX model has no latest_version.id');

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: {
        audio_file: audioUrl,
        align_output: true,
        diarization: false,
        language: 'en',
        // Do not pass initial_prompt — it can truncate WhisperX word output.
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail || body?.error || res.statusText;
    throw new Error(`WhisperX create failed (${res.status}): ${detail}`);
  }

  const done =
    body.status === 'succeeded'
      ? body
      : await waitForPrediction(token, body);

  const whisperWords = extractWhisperXWords(done.output);
  if (whisperWords.length === 0) {
    throw new Error('WhisperX returned no word timestamps.');
  }
  console.log(`WhisperX returned ${whisperWords.length} word timestamps.`);

  const lastEnd = whisperWords[whisperWords.length - 1]?.end;
  const audioDuration = await probeMp3DurationSeconds(mp3Path);
  return finalizeAlignedWords(
    tokenizePlainText(text),
    whisperWords,
    Math.max(Number(lastEnd) || 0, audioDuration || 0)
  );
}

async function alignWordTimings({ openai, replicateToken, text, audioBuffer, fileName }) {
  // Prefer Replicate WhisperX when available — OpenAI whisper-1 often 401s with project keys.
  if (replicateToken) {
    try {
      const result = await alignWithReplicateWhisperX(replicateToken, text, audioBuffer, fileName);
      return { ...result, alignment: 'replicate:victor-upmeet/whisperx' };
    } catch (err) {
      console.warn(`Replicate WhisperX align failed: ${err?.message || err}`);
    }
  }
  if (openai) {
    try {
      const result = await alignWithWhisper(openai, text, audioBuffer, fileName);
      return { ...result, alignment: 'openai:whisper-1' };
    } catch (err) {
      console.warn(`OpenAI Whisper align failed: ${err?.message || err}`);
    }
  }
  return { words: [], duration: 0, alignment: null };
}

function readExistingProvider() {
  try {
    if (!fs.existsSync(jsonPath)) return 'existing-audio';
    const prev = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return typeof prev?.provider === 'string' && prev.provider
      ? String(prev.provider).replace(/\+whisper-align$/, '') + '+whisper-align'
      : 'existing-audio+whisper-align';
  } catch {
    return 'existing-audio+whisper-align';
  }
}

async function main() {
  const alignOnly = process.argv.includes('--align-only');
  const env = loadEnv();
  const replicateToken = (env.REPLICATE_API_TOKEN || '').trim();
  const openaiKey = (env.OPENAI_API_KEY || '').trim();
  const openaiBase = (env.OPENAI_BASE_URL || '').trim().replace(/\/?$/, '');
  const projectId = (env.OPENAI_PROJECT_ID || '').trim();

  const openai = openaiKey
    ? new OpenAI({
        apiKey: openaiKey,
        ...(openaiBase ? { baseURL: openaiBase } : {}),
        ...(projectId ? { project: projectId } : {}),
      })
    : null;

  const text = NEURAL_SYNC_SAMPLE_TEXT;
  fs.mkdirSync(outDir, { recursive: true });

  let audioBuffer = null;
  let provider = '';
  let writeMp3 = true;
  let alignFileName = 'neural-sync.mp3';

  if (alignOnly) {
    if (!openai && !replicateToken) {
      throw new Error(
        '--align-only requires OPENAI_API_KEY or REPLICATE_API_TOKEN for word timestamps.'
      );
    }
    const wavPath = path.join(outDir, 'neural-sync.wav');
    if (fs.existsSync(mp3Path)) {
      audioBuffer = fs.readFileSync(mp3Path);
      alignFileName = 'neural-sync.mp3';
      writeMp3 = true;
    } else if (fs.existsSync(wavPath)) {
      audioBuffer = fs.readFileSync(wavPath);
      alignFileName = 'neural-sync.wav';
      writeMp3 = false;
    } else {
      throw new Error('No public/demo/neural-sync.mp3 (or .wav) to align. Run without --align-only first.');
    }
    provider = readExistingProvider();
    console.log(`Align-only mode: using ${alignFileName} (${audioBuffer.length} bytes)`);
  } else {
    try {
      if (replicateToken) {
        audioBuffer = await synthesizeWithReplicate(replicateToken, text);
        provider = 'replicate:minimax/speech-2.8-turbo';
      } else if (openai) {
        audioBuffer = await synthesizeWithOpenAI(openai, text);
        provider = `openai:${(process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts').trim()}`;
      } else {
        throw new Error('No Replicate or OpenAI TTS credentials');
      }
    } catch (ttsErr) {
      console.warn(`Cloud TTS failed: ${ttsErr?.message || ttsErr}`);
      audioBuffer = await synthesizeWithWindowsSapi(text);
      provider = 'windows:sapi';
      writeMp3 = false;
      alignFileName = 'neural-sync.wav';
    }

    if (writeMp3) {
      fs.writeFileSync(mp3Path, audioBuffer);
      console.log(`Wrote ${path.relative(root, mp3Path)} (${audioBuffer.length} bytes)`);
    } else {
      const wavPath = path.join(outDir, 'neural-sync.wav');
      if (!fs.existsSync(wavPath)) fs.writeFileSync(wavPath, audioBuffer);
      console.log(`Wrote ${path.relative(root, wavPath)} (${audioBuffer.length} bytes)`);
    }
  }

  let words = [];
  let duration = 0;
  let alignment = null;

  if (audioBuffer && (openai || replicateToken)) {
    const aligned = await alignWordTimings({
      openai,
      replicateToken,
      text,
      audioBuffer,
      fileName: alignFileName,
    });
    words = aligned.words;
    duration = aligned.duration;
    alignment = aligned.alignment;
  }

  if (words.length === 0) {
    if (!duration && writeMp3 && fs.existsSync(mp3Path)) {
      duration = await probeMp3DurationSeconds(mp3Path);
    }
    if (!duration && !writeMp3) {
      duration = wavDurationSeconds(audioBuffer);
    }
    if (!duration) {
      duration = Math.max(8, tokenizePlainText(text).length / 2.6);
    }
    words = proportionalWordTimings(text, duration);
    console.log('Using proportional word timings (Whisper unavailable).');
  }

  const payload = {
    text,
    duration,
    provider,
    generatedAt: new Date().toISOString(),
    words,
    ...(alignment
      ? { alignment }
      : { note: 'Proportional timings — re-run with OPENAI_API_KEY or REPLICATE_API_TOKEN for Whisper word sync.' }),
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    `Wrote ${path.relative(root, jsonPath)} (${words.length} words, duration≈${Number(duration).toFixed(2)}s, alignment=${alignment || 'proportional'})`
  );
  if (!replicateToken && !alignOnly) {
    console.log(
      'Tip: add REPLICATE_API_TOKEN from https://replicate.com/account/api-tokens and re-run for MiniMax voice.'
    );
  }
}

const isCli =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isCli) {
  main().catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  });
}