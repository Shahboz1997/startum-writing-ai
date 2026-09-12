/**
 * Replicate MiniMax TTS — used when the OpenAI project has no speech models.
 * Same model as scripts/generate-neural-sync-audio.mjs.
 */

const REPLICATE_MODEL = 'minimax/speech-2.8-turbo';
const POLL_MS = 2000;
const MAX_WAIT_MS = 90_000;

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

async function createPrediction(token, input) {
  const res = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({ input }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail || body?.error || res.statusText;
    throw new Error(`Replicate TTS create failed (${res.status}): ${detail}`);
  }
  return body;
}

async function getPrediction(token, id) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Replicate TTS poll failed (${res.status}): ${body?.detail || res.statusText}`
    );
  }
  return body;
}

async function waitForPrediction(token, prediction) {
  let current = prediction;
  const started = Date.now();
  while (
    current.status !== 'succeeded' &&
    current.status !== 'failed' &&
    current.status !== 'canceled'
  ) {
    if (Date.now() - started > MAX_WAIT_MS) {
      throw new Error(
        `Replicate TTS timed out after ${MAX_WAIT_MS}ms (status=${current.status})`
      );
    }
    await sleep(POLL_MS);
    current = await getPrediction(token, current.id);
  }
  if (current.status !== 'succeeded') {
    throw new Error(
      `Replicate TTS ${current.status}: ${current.error || 'unknown error'}`
    );
  }
  return current;
}

export function isReplicateTtsConfigured() {
  return Boolean((process.env.REPLICATE_API_TOKEN || '').trim());
}

/**
 * @param {string} text
 * @returns {Promise<{ ok: true, buffer: Buffer, via: string } | { ok: false, reason: string }>}
 */
export async function synthesizeWithReplicateTts(text) {
  const token = (process.env.REPLICATE_API_TOKEN || '').trim();
  if (!token) {
    return { ok: false, reason: 'no_replicate' };
  }
  const inputText = String(text || '').replace(/\s+/g, ' ').trim();
  if (!inputText) {
    return { ok: false, reason: 'bad_input' };
  }

  try {
    const prediction = await createPrediction(token, {
      text: inputText,
      voice_id: 'English_Trustworth_Man',
      speed: 1,
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
    if (!url) {
      return { ok: false, reason: 'no_audio_url' };
    }

    const audioRes = await fetch(url);
    if (!audioRes.ok) {
      return { ok: false, reason: `download_${audioRes.status}` };
    }

    const buffer = Buffer.from(await audioRes.arrayBuffer());
    if (!buffer.length) {
      return { ok: false, reason: 'empty_audio' };
    }

    return { ok: true, buffer, via: `replicate:${REPLICATE_MODEL}` };
  } catch (err) {
    console.error('[replicateTts]', err?.message || err);
    return { ok: false, reason: err?.message || 'replicate_failed' };
  }
}
