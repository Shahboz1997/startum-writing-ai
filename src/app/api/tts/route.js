import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import {
  createOpenAIClient,
  validateOpenAIEnvForRoute,
  openAIErrorToJsonResponse,
  getTrimmedOpenAIKey,
} from '@/lib/openaiServer.js';
import { requireAuthenticatedAiAccess } from '@/lib/aiRouteGuard.js';
import { alignWordTimingsForAudio } from '@/lib/alignWordTimingsServer.js';
import {
  isReplicateTtsConfigured,
  synthesizeWithReplicateTts,
} from '@/lib/replicateTts.js';

/** WhisperX + long essays need more than the default serverless window. */
export const maxDuration = 60;

export async function POST(req) {
  try {
    const hasOpenAI = Boolean(getTrimmedOpenAIKey());
    const hasReplicate = isReplicateTtsConfigured();
    if (!hasOpenAI && !hasReplicate) {
      const envError = validateOpenAIEnvForRoute();
      if (envError) return envError;
    }

    const session = await safeAuth();
    const access = await requireAuthenticatedAiAccess(req, session, 'tts');
    if (!access.ok) return access.response;

    let openai = null;
    if (hasOpenAI) {
      const clientResult = createOpenAIClient();
      if (!clientResult.error) {
        openai = clientResult.openai;
      } else if (!hasReplicate) {
        return clientResult.error;
      }
    }

    const { text, filename } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing "text"' }, { status: 400 });
    }
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Missing "filename"' }, { status: 400 });
    }

    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return NextResponse.json({ error: 'Text is empty' }, { status: 400 });
    }

    // gpt-4o-mini-tts hard limit is ~2000 input chars; keep headroom.
    const TTS_MAX_CHARS = 2000;
    const ttsInput =
      cleanText.length > TTS_MAX_CHARS
        ? `${cleanText.slice(0, TTS_MAX_CHARS - 1).trim()}…`
        : cleanText;

    // Some OpenAI projects allow tts-1 but not gpt-4o-mini-tts (and vice versa).
    const preferred = (process.env.OPENAI_TTS_MODEL || '').trim();
    const ttsModels = [
      ...new Set(
        [preferred, 'tts-1', 'gpt-4o-mini-tts', 'tts-1-hd'].filter(Boolean)
      ),
    ];

    let buffer;
    let usedModel = null;
    let lastTtsErr = null;

    if (openai) {
      for (const ttsModel of ttsModels) {
        try {
          // `fable` is the clearest British-leaning OpenAI preset (IELTS Listening-like).
          const openaiVoice =
            (process.env.OPENAI_TTS_VOICE || '').trim() || 'fable';
          const mp3 = await openai.audio.speech.create({
            model: ttsModel,
            voice: openaiVoice,
            input: ttsInput,
          });
          buffer = Buffer.from(await mp3.arrayBuffer());
          usedModel = ttsModel;
          lastTtsErr = null;
          break;
        } catch (ttsErr) {
          lastTtsErr = ttsErr;
          const code = ttsErr?.code ?? ttsErr?.error?.code;
          const msg = String(ttsErr?.message ?? ttsErr?.error?.message ?? '');
          const modelDenied =
            code === 'model_not_found' || /does not have access to model/i.test(msg);
          console.warn('[api/tts] speech.create failed:', {
            status: ttsErr?.status ?? ttsErr?.statusCode,
            code,
            message: msg.slice(0, 200),
            ttsModel,
            chars: ttsInput.length,
            willRetry: modelDenied && ttsModel !== ttsModels[ttsModels.length - 1],
          });
          if (!modelDenied) break;
        }
      }
    }

    // OpenAI project often blocks all speech models — fall back to Replicate MiniMax.
    if (!buffer && hasReplicate) {
      console.warn('[api/tts] OpenAI TTS unavailable; trying Replicate MiniMax');
      const replicate = await synthesizeWithReplicateTts(ttsInput);
      if (replicate.ok) {
        buffer = replicate.buffer;
        usedModel = replicate.via;
      } else {
        console.error('[api/tts] Replicate TTS failed:', replicate.reason);
      }
    }

    if (!buffer) {
      console.error('[api/tts] all TTS providers failed', {
        tried: ttsModels,
        replicate: hasReplicate,
        chars: ttsInput.length,
      });
      if (lastTtsErr) {
        const mapped = openAIErrorToJsonResponse(lastTtsErr);
        if (mapped) return mapped;
      }
      return NextResponse.json(
        {
          error: hasReplicate
            ? 'Voice generation failed (OpenAI speech models blocked and Replicate fallback failed).'
            : lastTtsErr?.message ||
              'TTS speech generation failed. Add REPLICATE_API_TOKEN or enable OpenAI speech models.',
        },
        { status: 502 }
      );
    }

    if (preferred && usedModel && usedModel !== preferred) {
      console.info('[api/tts] using fallback speech provider', {
        preferred,
        usedModel,
      });
    }

    let wordTimestamps = [];
    let alignment = null;
    let duration = null;
    try {
      const aligned = await alignWordTimingsForAudio({
        text: ttsInput,
        audioBuffer: buffer,
        openai,
        fileName: 'tts.mp3',
      });
      wordTimestamps = Array.isArray(aligned.words) ? aligned.words : [];
      alignment = aligned.alignment || null;
      duration = aligned.duration || null;
      if (!alignment) {
        console.warn(
          'TTS karaoke align failed; client may use proportional timings:',
          aligned.error
        );
      }
    } catch (alignErr) {
      // Never fail the whole TTS response because karaoke alignment failed.
      console.warn(
        '[api/tts] align threw (audio still returned):',
        alignErr?.message || alignErr
      );
    }

    return NextResponse.json({
      audioBase64: buffer.toString('base64'),
      wordTimestamps,
      alignment,
      duration,
    });
  } catch (error) {
    console.error('[api/tts] unexpected:', {
      status: error?.status ?? error?.statusCode,
      code: error?.code ?? error?.error?.code,
      message: error?.message ?? error?.error?.message,
    });
    const mapped = openAIErrorToJsonResponse(error);
    if (mapped) return mapped;
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}
