export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';

const API_KEY_ERROR_MSG = 'Check API Key. Add a valid OPENAI_API_KEY to .env.local.';

/** baseURL ends with /v1. Use OPENAI_BASE_URL in .env for Cloudflare proxy. */
function getOpenAIBaseURL() {
  const raw = process.env.OPENAI_BASE_URL;
  const base = typeof raw === 'string' ? raw.trim() : 'https://api.openai.com/v1';
  const url = base.length > 0 ? base : 'https://api.openai.com/v1';
  return url.endsWith('/v1') ? url : url.replace(/\/?$/, '') + '/v1';
}

/** Uses process.env.OPENAI_API_KEY and OPENAI_PROJECT_ID (server-side). Key is trimmed to remove hidden \\r/spaces. */
let _openaiKeyLogged = false;
function getOpenAIClient() {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  const hasKey = apiKey.length > 0;

  if (!hasKey) {
    console.error('OPENAI_API_KEY is missing or empty. Set it in .env.local and restart the dev server.');
    return { error: NextResponse.json({ error: 'Server Configuration Error: Missing API Key' }, { status: 401 }) };
  }

  const baseURL = getOpenAIBaseURL();
  const project = typeof process.env.OPENAI_PROJECT_ID === 'string' ? process.env.OPENAI_PROJECT_ID.trim() : undefined;
  const organization = typeof process.env.OPENAI_ORG_ID === 'string' ? process.env.OPENAI_ORG_ID.trim() : undefined;
  if (!_openaiKeyLogged) {
    _openaiKeyLogged = true;
    console.log('[OpenAI] API key loaded at first use; baseURL:', baseURL, 'project:', project || '(none)');
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
    organization: organization || undefined,
    project: project || undefined,
  });
  return { openai: client };
}

function isOpenAIAuthError(err) {
  if (!err) return false;
  const status = err.status ?? err.statusCode ?? err.response?.status;
  const code = err.code ?? err.error?.code;
  const msg = (err.message || err.error?.message || '').toLowerCase();
  return status === 401 || code === 'invalid_api_key' || code === 'authentication_error' || msg.includes('api key') || msg.includes('incorrect api key');
}

const TASK1_FOCUS = `TASK 1 (Academic) FOCUS:
- Task Achievement: Accurate reporting of main trends, key features, and data; clear overview; no irrelevant detail.
- Coherence and Cohesion: Logical organisation; accurate data comparisons; appropriate linking (e.g. "whereas", "in contrast"); clear progression.`;

const TASK2_FOCUS = `TASK 2 (General/Academic) FOCUS:
- Task Response: Clear position; full development of ideas; relevant examples; argument progression.
- Coherence and Cohesion: Clear paragraphing; logical flow; cohesive devices; topic sentences.`;

const BAND_LIMITERS = `STRICT BAND LIMITERS (apply rigorously):
- If there are systematic grammar errors (e.g. repeated article/subject-verb errors), Grammatical_Range_and_Accuracy MUST NOT exceed 6.0, even if vocabulary is C2.
- If vocabulary is mostly high-frequency (Band 5–6), Lexical_Resource MUST NOT exceed 6.0.
- Band 7.0+ only when "less common lexical items" and a variety of structures with good control appear.
- Band 8.0–9.0 only for near-native fluency, sophisticated vocabulary, and no systematic errors. Use the official 0–9 scale only.`;

function buildExaminerPrompt(taskCriteriaName, isT1) {
  const taskFocus = isT1 ? TASK1_FOCUS : TASK2_FOCUS;
  return `You are a Senior IELTS Examiner (IDP/BC certified). Evaluate the script against the official IELTS Writing Band Descriptors. Be precise and consistent.

${taskFocus}

${BAND_LIMITERS}

OUTPUT RULES:
1. Every highlight must have "type" exactly one of: "grammar" | "lexical" | "cohesion". (grammar = errors; lexical = poor word choice/repetition; cohesion = linking/flow issues.)
2. "corrections" must each include: category (e.g. "Articles", "Subject-Verb Agreement", "Punctuation", "Lexical Precision"), impact (how much this error affects the band, e.g. "high"/"medium"/"low"), band_descriptor (short reference to official criteria, e.g. "Limited range of structures").
3. "lexical_upgrade": list words/phrases that are Band 5–6 level with Band 8–9 academic synonyms.
4. "suggested_rewrite": full professional rewrite of the essay. You may add a short "structural_changes" note if helpful.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "overall_band": 0.0,
  "word_count": 0,
  "improvement_strategy": "string",
  "criteria": {
    "${taskCriteriaName}": { "score": 0.0, "comment": "string" },
    "Coherence_and_Cohesion": { "score": 0.0, "comment": "string" },
    "Lexical_Resource": { "score": 0.0, "comment": "string" },
    "Grammatical_Range_and_Accuracy": { "score": 0.0, "comment": "string" }
  },
  "highlights": [
    { "text": "exact phrase from essay", "type": "grammar" | "lexical" | "cohesion", "suggestion": "string" }
  ],
  "corrections": [
    {
      "original": "string",
      "fixed": "string",
      "category": "string",
      "impact": "high|medium|low",
      "band_descriptor": "string",
      "explanation": "string"
    }
  ],
  "lexical_upgrade": [
    { "band_56_word": "string", "band_89_synonyms": ["string"] }
  ],
  "analysis": {
    "linking_words": { "score": 0, "found": [], "suggestions": [] },
    "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }]
  },
  "suggested_rewrite": "string"
}`;
}

async function imageUrlToBase64(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid MIME type: ${contentType}. Expected an image.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Proxy Error:", error.message);
    throw error;
  }
}

export async function DELETE(req) {
  return NextResponse.json({ message: "Archive cleared" }, { status: 200 });
}
export async function POST(req) {
  try {
    // Single trimmed key so we never use raw env (avoids hidden \r or spaces). If you still see wrong key, it's from another source.
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    console.log("DEBUG: Request received. API Key Length:", apiKey.length);
    console.log("DEBUG: Key Ends With (trimmed):", apiKey.slice(-4));
    if (!apiKey) {
      return NextResponse.json({ error: "Environment variable NOT LOADED" }, { status: 401 });
    }
    if (apiKey.slice(-4) === 'nTkA') {
      console.warn("OPENAI_API_KEY still ends with nTkA (old key). Next.js does NOT override existing env: if OPENAI_API_KEY is set in your shell or system, that wins over .env.local. Unset it before starting: PowerShell: $env:OPENAI_API_KEY=''; npm run dev. Or check .env .env.development .env.development.local in project root.");
    }
    console.log("Attempting OpenAI request with Project:", process.env.OPENAI_PROJECT_ID, "Key ends with:", apiKey.slice(-4));
    const body = await req.json();
     // --- НОВЫЙ РЕЖИМ: Отправка Email (Feedback/Improvement Hub) ---
    // Проверяем наличие полей, которые приходят из вашей формы
    if (body.name && body.email && body.message) {
      try {
       const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Sashabilov25@gmail.com', // Ваша почта
    pass: 'lnnr aesp zizm nvvr',    // ВСТАВЬТЕ СЮДА ВАШ 16-ЗНАЧНЫЙ КОД ИЗ GOOGLE
  },
});
await transporter.sendMail({
  from: process.env.EMAIL_USER, // Это Sashabilov25@gmail.com
  
  // ИСПРАВЬТЕ ЭТУ СТРОКУ:
  to: 'Sashabilov25@gmail.com', // Или любая другая ВАША рабочая почта
  
  subject: `🚀 STRATUM.ai Feedback: ${body.name}`,
  html: `
    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 15px;">
      <h2 style="color: #ef4444; text-transform: uppercase;">New Improvement Suggestion</h2>
      <p><strong>Name:</strong> ${body.name}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-style: italic;">"${body.message}"</p>
      </div>
    </div>
  `,
});


        return NextResponse.json({ success: true });
      } catch (mailError) {
        console.error("Mail Error:", mailError);
        return NextResponse.json({ error: "Mail system error" }, { status: 500 });
      }
    }
    // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision / OCR) ---
    // Frontend sends POST with { describeImage: true, image: base64OrUrl }. API key is read at request time via getOpenAIClient().
    if (body.describeImage && body.image) {
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      try {
        let finalImage;
        if (body.image.startsWith('http')) {
          finalImage = await imageUrlToBase64(body.image);
        } else {
          finalImage = body.image;
        }

        // gpt-4o supports vision (image inputs). Do not use gpt-4o-mini or older models for image processing.
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an IELTS Task 1 Expert. Describe this chart in detail. Identify the exact chart type, years, and categories. Return ONLY the question text."
            },
            {
              role: "user",
              content: [{ type: "image_url", image_url: { url: finalImage } }]
            }
          ],
        });

        return NextResponse.json({ question: response.choices[0].message.content });
      } catch (error) {
        console.error("OpenAI error (describeImage):", error?.response ?? error?.error ?? error?.message, "response?.data:", error?.response?.data ?? error?.error);
        if (isOpenAIAuthError(error)) {
          return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
        }
        return NextResponse.json({ 
          error: "The selected image source is protected or invalid. Please upload a file manually or try another topic.",
          question: null
        }, { status: 500 });
      }
    }

    // --- 2. РЕЖИМ: Генерация случайного Task 1 (Текст) ---
    if (body.generateTask1) {
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "You are an IELTS Examiner. Generate a professional Academic Task 1 prompt. START with the chart type." 
            },
            { role: "user", content: "Generate a new Academic Task 1 topic." }
          ]
        });
        return NextResponse.json({ question: response.choices[0].message.content });
      } catch (err) {
        console.error('Generate Task 1 error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        if (isOpenAIAuthError(err)) {
          return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
        }
        return NextResponse.json({ error: err?.message || 'Topic generation failed.' }, { status: 500 });
      }
    }

    // --- 3. РЕЖИМ: Генерация темы Task 2 ---
    if (body.generateTopic) {
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an IELTS Examiner. Generate a Task 2 question. Return ONLY the text." },
            { role: "user", content: `Topic: ${keyword || 'General'}` }
          ]
        });
        const raw = response?.choices?.[0]?.message?.content;
        const text = (typeof raw === 'string' ? raw : '').trim();
        if (!text) {
          return NextResponse.json(
            { error: 'Could not generate a topic. Please try again.' },
            { status: 502 }
          );
        }
        return NextResponse.json({ question: text });
      } catch (err) {
        console.error('Generate topic error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        if (isOpenAIAuthError(err)) {
          return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
        }
        return NextResponse.json(
          { error: err?.message || err?.error?.message || 'Topic generation failed.' },
          { status: 500 }
        );
      }
    }

    // --- 4. ОСНОВНОЙ РЕЖИМ: Глубокий анализ эссе ---
    const { essay1, essay2, image, analysisMode, promptText } = body;
    const isT1 = analysisMode === 'task1';
    const userText = isT1 ? essay1 : essay2;
    const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';

    if (!userText || userText.trim().length < 10) {
      return NextResponse.json({ error: "Text is too short for analysis." }, { status: 400 });
    }

    const { auth } = await import('@/app/api/auth/[...nextauth]/route');
    const { getPrisma } = await import('@/lib/prisma');
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in to check your essay." }, { status: 401 });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.credits != null && user.credits < 1)) {
      return NextResponse.json({ error: "You have run out of credits. Please refill to continue." }, { status: 403 });
    }
    const clientResult = getOpenAIClient();
    if (clientResult.error) return clientResult.error;
    const openai = clientResult.openai;

    const examinerPrompt = buildExaminerPrompt(taskCriteriaName, isT1);
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: examinerPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY:\n${userText}` },
              ...(isT1 && image ? [{ type: "image_url", image_url: { url: image } }] : [])
            ]
          }
        ],
        response_format: { type: "json_object" }
      });
    } catch (err) {
      console.error('OpenAI error (essay check):', err?.response ?? err?.error ?? err?.message, 'response?.data:', err?.response?.data ?? err?.error);
      if (isOpenAIAuthError(err)) {
        return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
      }
      throw err;
    }

    const result = JSON.parse(response.choices[0].message.content);
    result.word_count = result.word_count ?? userText.trim().split(/\s+/).filter(Boolean).length;
    if (!Array.isArray(result.highlights)) result.highlights = [];
    result.highlights = result.highlights.map(h => ({
      ...h,
      type: ['grammar', 'lexical', 'cohesion'].includes(h.type) ? h.type : (h.type === 'error' ? 'grammar' : 'lexical')
    }));
    if (!Array.isArray(result.corrections)) result.corrections = [];
    result.corrections = result.corrections.map(c => ({
      ...c,
      category: c.category || c.rule || 'General',
      impact: c.impact || 'medium',
      band_descriptor: c.band_descriptor || ''
    }));
    if (!Array.isArray(result.lexical_upgrade)) result.lexical_upgrade = [];

    const typeValue = isT1 ? 'TASK_1' : 'TASK_2';
    const userId = session.user.id;

    // Run create and update separately to avoid transaction timeout (e.g. "Unable to start a transaction in the given time").
    // Ensure DATABASE_URL / DIRECT_URL in .env.local is correct and reachable (VPN/network).
    const savedCheck = await prisma.check.create({
      data: {
        type: typeValue,
        content: userText,
        promptText: promptText || null,
        score: result.overall_band,
        feedback: JSON.stringify(result),
        userId,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({ ...result, savedId: savedCheck.id });
  } catch (error) {
    console.error("API ERROR:", error);
    if (isOpenAIAuthError(error)) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Server error.' }, { status: 500 });
  }
}

