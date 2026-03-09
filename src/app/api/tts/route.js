import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = (process.env.OPENAI_API_KEY || '').trim();
let _readyLogged = false;

function getOpenAIClient() {
  if (!apiKey) return null;
  if (!_readyLogged) {
    _readyLogged = true;
    console.log("STRATUM_SYSTEM_READY: API Key Verified.");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req) {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: 'Server Configuration Error: Missing API Key' }, { status: 401 });
    }

    const { text, filename } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing "text"' }, { status: 400 });
    }
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Missing "filename"' }, { status: 400 });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioFile = new File([buffer], 'tts.mp3', { type: 'audio/mpeg' });

    let wordTimestamps = [];
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });
      if (transcription?.words?.length) {
        wordTimestamps = transcription.words.map((w) => ({
          word: w.word,
          start: Number(w.start),
          end: Number(w.end),
        }));
      }
    } catch (whisperErr) {
      console.warn('Whisper word timestamps failed, continuing without:', whisperErr?.message);
    }

    const audioBase64 = buffer.toString('base64');
    return NextResponse.json({
      audioBase64,
      wordTimestamps,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
