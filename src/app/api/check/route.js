export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import https from 'https';
import http from 'http';
import { URL as NodeURL } from 'url';
import {
  IELTS_TASK1_STANDARD_INSTRUCTION,
  buildTask1QuestionPaperText,
} from '@/lib/task1Prompt.js';

const API_KEY_ERROR_MSG = 'Check API Key. Add a valid OPENAI_API_KEY to .env.local.';

/**
 * Vision models sometimes return a full "sample report" despite instructions — drop it and use standard wording only.
 */
function sanitizeTask1VisionIntro(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.trim();
  const fence = /^```(?:\w*)?\s*([\s\S]*?)```\s*$/m.exec(s);
  if (fence) s = fence[1].trim();
  s = s.replace(/^["']|["']$/g, '').trim();
  if (!s || /^none\.?$/i.test(s)) return '';
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 90) return '';
  const paras = s.split(/\n\s*\n/).filter((p) => p.trim());
  if (paras.length > 2) return '';
  const lower = s.toLowerCase();
  if (
    lower.includes('in conclusion') ||
    lower.includes('to sum up') ||
    lower.includes('to summarise') ||
    lower.includes('in summary,')
  ) {
    return '';
  }
  const digitGroups = s.match(/\d[\d,.\s]*/g) || [];
  if (digitGroups.length >= 5) return '';
  const essayPhrases = [
    'overall,',
    'overall the',
    'it can be seen that',
    'it is clear that',
    'peaking at',
    'the second highest',
    'respectively.',
    'by contrast',
  ];
  let hits = 0;
  for (const ph of essayPhrases) {
    if (lower.includes(ph)) hits++;
  }
  if (hits >= 2) return '';
  return s;
}

/** baseURL ends with /v1. Use OPENAI_BASE_URL in .env for Cloudflare proxy. */
function getOpenAIBaseURL() {
  const raw = process.env.OPENAI_BASE_URL;
  const base = typeof raw === 'string' ? raw.trim() : 'https://api.openai.com/v1';
  const url = base.length > 0 ? base : 'https://api.openai.com/v1';
  return url.endsWith('/v1') ? url : url.replace(/\/?$/, '') + '/v1';
}

/** Uses process.env.OPENAI_API_KEY and OPENAI_PROJECT_ID (server-side). Key is trimmed to remove hidden \\r/spaces. */
let _openaiKeyLogged = false;
// function getOpenAIClient() {
//   const apiKey = (process.env.OPENAI_API_KEY || '').trim();
//   const hasKey = apiKey.length > 0;

//   if (!hasKey) {
//     console.error('OPENAI_API_KEY is missing or empty. Set it in .env.local and restart the dev server.');
//     return { error: NextResponse.json({ error: 'Server Configuration Error: Missing API Key' }, { status: 401 }) };
//   }

//   const baseURL = getOpenAIBaseURL();
//   const project = typeof process.env.OPENAI_PROJECT_ID === 'string' ? process.env.OPENAI_PROJECT_ID.trim() : undefined;
//   const organization = typeof process.env.OPENAI_ORG_ID === 'string' ? process.env.OPENAI_ORG_ID.trim() : undefined;
//   if (!_openaiKeyLogged) {
//     _openaiKeyLogged = true;
//     console.log("STRATUM_SYSTEM_READY: API Key Verified.");
//     console.log('[OpenAI] API key loaded at first use; baseURL:', baseURL, 'project:', project || '(none)');
//   }

//   const client = new OpenAI({
//     apiKey,
//     baseURL,
//     organization: organization || undefined,
//     project: project || undefined,
//   });
//   return { openai: client };
// }
/** Retries transient Undici/Node "fetch failed" / connection drops when calling OpenAI. */
async function resilientFetch(input, init) {
  const max = 4;
  let lastErr;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err?.cause?.message || '').toLowerCase();
      const code = err?.cause?.code || err?.code;
      const retryable =
        msg.includes('fetch failed') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('epipe') ||
        msg.includes('socket') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNREFUSED';
      if (!retryable || attempt === max - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function getOpenAIClient() {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  
  if (!apiKey) {
    return { error: NextResponse.json({ error: 'Missing API Key' }, { status: 401 }) };
  }

  // ЛОГ ДЛЯ ПРОВЕРКИ (появится в терминале)
  console.log(`[DEBUG] Using Key: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`);
  
  const client = new OpenAI({
    apiKey,
    baseURL: getOpenAIBaseURL(),
    maxRetries: 4,
    timeout: 600_000,
    fetch: resilientFetch,
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

/** Model sometimes wraps JSON in ```json ... ``` despite instructions. */
function stripMarkdownJsonFence(text) {
  if (typeof text !== 'string') return '';
  let s = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```\s*$/im.exec(s);
  if (m) return m[1].trim();
  return s;
}

/**
 * Parse examiner JSON; avoids throwing into outer handler (SyntaxError → opaque 500 / empty axios data).
 * Truncation at max_tokens often yields "Unterminated string in JSON".
 */
function parseExaminerJson(content) {
  const raw = stripMarkdownJsonFence(typeof content === 'string' ? content : '');
  if (!raw) {
    return { ok: false, error: 'Empty model response' };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    const msg = e?.message || 'Invalid JSON';
    console.error('[/api/check] Examiner JSON parse error:', msg, {
      length: raw.length,
      head: raw.slice(0, 160),
      tail: raw.slice(-160),
    });
    return { ok: false, error: msg };
  }
}

const ERROR_TYPES_ALLOWED = new Set(['grammar', 'logic', 'lexical']);

function normalizeExaminerErrorType(t) {
  const s = String(t || '')
    .toLowerCase()
    .trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (ERROR_TYPES_ALLOWED.has(s)) return s;
  return 'grammar';
}

/**
 * Single canonical list for the app. Order: model `errors` first, then logical_errors, corrections, highlights (skip duplicates by original text).
 */
function mergeUnifiedErrors(result) {
  const byKey = new Map();

  const push = (row) => {
    const original = String(row?.original ?? row?.phrase ?? row?.text ?? '')
      .trim();
    if (!original) return;
    const key = original.toLowerCase();
    if (byKey.has(key)) return;
    const type = normalizeExaminerErrorType(row.type ?? row.category);
    // App expects `fixed`/`suggestion`, but the examiner may return `correction` instead.
    const fixed =
      typeof row.fixed === 'string'
        ? row.fixed.trim()
        : typeof row.correction === 'string'
          ? row.correction.trim()
          : '';
    const suggestion = typeof row.suggestion === 'string' ? row.suggestion.trim() : '';
    const explanation =
      typeof row.explanation === 'string'
        ? row.explanation.trim()
        : typeof row.reason === 'string'
          ? row.reason.trim()
          : '';
    byKey.set(key, {
      original,
      type,
      fixed: fixed || suggestion,
      suggestion: suggestion || fixed,
      explanation:
        explanation ||
        (type === 'logic'
          ? 'This issue affects Task Achievement or Task Response and may lower your band.'
          : 'See criterion feedback for impact on your band score.'),
    });
  };

  (Array.isArray(result.errors) ? result.errors : []).forEach(push);
  (Array.isArray(result.logical_errors) ? result.logical_errors : []).forEach((e) =>
    push({
      phrase: e?.phrase,
      text: e?.text,
      type: 'logic',
      explanation: e?.explanation ?? e?.reason,
      fixed: typeof e?.fixed === 'string' ? e.fixed : '',
    })
  );
  (Array.isArray(result.corrections) ? result.corrections : []).forEach((c) => push(c));
  (Array.isArray(result.highlights) ? result.highlights : []).forEach((h) =>
    push({
      text: h?.text,
      type: h?.type,
      suggestion: h?.suggestion,
      fixed: '',
      explanation: typeof h?.suggestion === 'string' ? h.suggestion : '',
    })
  );

  return Array.from(byKey.values()).map((e, i) => ({
    ...e,
    id: `err-${i}`,
  }));
}

function correctionsFromErrors(errorsArr) {
  return (errorsArr || []).map((e) => ({
    original: e.original,
    fixed: e.fixed || '',
    category: e.type === 'lexical' ? 'Vocabulary' : e.type === 'logic' ? 'Logic' : 'Grammar',
    impact: 'medium',
    band_descriptor: '',
    explanation: e.explanation || '',
    rule: e.type === 'lexical' ? 'Vocabulary' : e.type === 'logic' ? 'Logic' : 'Grammar',
  }));
}

function buildIeltsCheckSystemPrompt(taskCriteriaName, isT1) {
  const targetBand = isT1 ? 'Task Achievement' : 'Task Response';
  const targetContext = isT1 ? 'data description' : 'argumentation';
  const sternDataAnalyst = `You are a professional IELTS Data Analyst. Your main task is to identify CONTRADICTIONS in the ${targetContext} (${targetBand}).

Categorize errors strictly into 3 types:
- 'logic' (Blue) - for factual errors, contradictory trends (e.g., saying 'doubled' then 'decreased to 0'), or missing overview/incorrect overview.
- 'lexical' (Purple) - for repetitive words, informal tone, or low-level vocabulary.
- 'grammar' (Red) - for syntax, tenses, and punctuation.

If the user mentions a trend/claim that contradicts their previous sentence (e.g., 'Atlantic City had the largest increase' vs 'decreased back to 0'), YOU MUST mark it as 'logic'.

Be exhaustive and do not be lazy: list every contradiction you can find; do not summarize or reduce the number of items.`;

  const baseCriteria = `FOUR IELTS CRITERIA — score each 0.0–9.0 (halves allowed) with a concise comment:
- **${isT1 ? 'Task Achievement' : 'Task Response'}**, **Coherence and Cohesion**, **Lexical Resource**, **Grammatical Range and Accuracy**.`;

  const errorsSpec = `Strict Schema for the "errors" array (mandatory):
Each error MUST have exactly:
{
  "original": "exact phrase from text",
  "correction": "corrected phrase (or empty string if no one-to-one correction is possible)",
  "type": "logic" | "grammar" | "lexical",
  "explanation": "Start with 'Logic Error:' or 'Grammar Error:' (or 'Lexical Error:'). Explain EXACTLY why the data/argument is wrong and how it lowers the Band score."
}

Error categories:
- "logic" (Blue): factual errors, contradictions, wrong trends, missing overview/incorrect overview impact, or thesis–example disconnect.
- "lexical" (Purple): overused words, informal tone, simple vocabulary, wrong collocations.
- "grammar" (Red): tense, articles, punctuation, subject-verb agreement, sentence structure.`;

  const task1Rules = `You are a strict universal IELTS Writing expert (British Council / IDP style).
The student wrote **Academic Task 1** (graph, chart, table, diagram, or process).

${sternDataAnalyst}

1) WHEN AN IMAGE IS PROVIDED: treat it as the source of truth. Cross-check every number, trend, comparison, and overview against the visual. Flag factual mistakes, wrong trends, contradictions with the data, or unsupported claims as type "logic" in the "errors" array.

2) WHEN NO IMAGE: still use the task prompt and any stated data; flag internal contradictions and implausible claims as type "logic".

${baseCriteria}

${errorsSpec}

Keep "analysis.word_repetition" and "lexical_upgrade" as before.

Return a Band 9.0–level "suggested_rewrite" with paragraphs separated by \\n\\n; no bullets or markdown inside the essay body. Rewrite the essay to Band 9.0 level. Wrap every improved phrase, advanced word, or structural change in <mark>...</mark> tags (lowercase only) so the UI can highlight them; do not use any other HTML or markdown inside the essay.`;

  const task2Rules = `You are a strict universal IELTS Writing expert (British Council / IDP style).
The student wrote **Task 2** (opinion / discussion essay). There is **no chart image**.

Treat logical contradictions in argumentation (claims that contradict each other, irrelevant examples, unclear thesis–example links) as type "logic".

${sternDataAnalyst}

Check:
1) Task Response: whether the thesis is relevant and developed; any contradictory or unsupported argumentation must be type "logic" with a precise "original" excerpt.
2) Structure coherence: if the essay lacks a clear introduction/position, body progression, or conclusion linkage, mark it as type "logic" where appropriate.

${baseCriteria.replace('Task Achievement', 'Task Response')}

${errorsSpec}

Keep "analysis.word_repetition" and "lexical_upgrade" as before.

Return a Band 9.0–level "suggested_rewrite" with paragraphs separated by \\n\\n; no bullets or markdown inside the essay body. Rewrite the essay to Band 9.0 level. Wrap every improved phrase, advanced word, or structural change in <mark>...</mark> tags (lowercase only) so the UI can highlight them; do not use any other HTML or markdown inside the essay.`;

  const taskBlock = isT1 ? task1Rules : task2Rules;

  const checklistInstruction = isT1
    ? `CHECKLIST: Return booleans by evaluating the examiner tips against the student essay.
- overview_included: contains an overview sentence summarizing the main features/trends (Task 1 only).
- data_accuracy: no contradictions with the chart/table data (no wrong numbers/trends/claims).
- no_personal_opinion: no personal opinion / no first-person evaluation (Task 1 only).
- comparisons_made: includes explicit comparisons between categories/trends (higher/lower, more/less, etc.).
- complex_sentences: uses complex structures (subordination/relative clauses) rather than only simple sentences.`
    : `CHECKLIST: Return booleans by evaluating the examiner tips against the student essay.
- clear_thesis_statement: introduction clearly states the position/main argument addressing the prompt.
- paragraph_unity: each paragraph stays focused on one main idea (no mixing/off-topic drift).
- main_ideas_supported: main ideas are supported with reasons and/or specific examples.
- academic_register: formal academic tone (no slang/contractions/informal phrases).
- logical_conclusion: conclusion logically restates key points and answers the prompt.`;

  const checklistOutputExample = isT1
    ? `"checklist": {
    "overview_included": false,
    "data_accuracy": false,
    "no_personal_opinion": false,
    "comparisons_made": false,
    "complex_sentences": false
  },`
    : `"checklist": {
    "clear_thesis_statement": false,
    "paragraph_unity": false,
    "main_ideas_supported": false,
    "academic_register": false,
    "logical_conclusion": false
  },`;

  return `${taskBlock}

${checklistInstruction}

OUTPUT: Return **ONLY** valid JSON (no markdown fences). Shape:
{
  "overall_band": 0.0,
  "word_count": 0,
  "improvement_strategy": "Brief overall feedback to the candidate.",
  "criteria": {
    "${taskCriteriaName}": { "score": 0.0, "comment": "string" },
    "Coherence_and_Cohesion": { "score": 0.0, "comment": "string" },
    "Lexical_Resource": { "score": 0.0, "comment": "string" },
    "Grammatical_Range_and_Accuracy": { "score": 0.0, "comment": "string" }
  },
  "errors": [
    {
      "original": "exact substring copied from the student essay",
      "correction": "corrected phrase; use empty string if no one-to-one replacement is possible",
      "type": "grammar" | "logic" | "lexical",
      "explanation": "Start with 'Logic Error:' or 'Grammar Error:' (or 'Lexical Error:'). Explain EXACTLY why the data/argument is wrong and how it lowers the Band score."
    }
  ],
  "logical_errors": [],
  "highlights": [],
  "corrections": [],
  "lexical_upgrade": [
    { "band_56_word": "string", "band_89_synonyms": ["string", "string", "string"] }
  ],
  "analysis": {
    "linking_words": { "score": 0, "found": [], "suggestions": [] },
    "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }]
  },
  ${checklistOutputExample}
  "suggested_rewrite": "Intro with <mark>improved phrasing</mark>.\\n\\nBody...\\n\\nClosing..."
}

Rules: Whenever the essay has issues, list them in **errors** with **type** ∈ { grammar, logic, lexical }. Use [] only if the essay is genuinely flawless. You MUST also return the **checklist** object with ALL required boolean keys (no missing keys, no nulls, no strings). You may leave **logical_errors**, **highlights**, and **corrections** as empty arrays — the app merges legacy fields if present. Be rigorous; scores must match official descriptor limits.`; 
}

/** Legacy compact API shape → full app shape */
function isSimplifiedCheckResult(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.overall_band != null && typeof obj.overall_band === 'number') return false;
  if (Array.isArray(obj.logical_errors)) return false;
  return 'bandScore' in obj || 'suggestedRewrite' in obj;
}

function normalizeSimplifiedCheckResult(raw, taskCriteriaName, userText) {
  const feedback = typeof raw.feedback === 'string' ? raw.feedback : '';
  const suggested =
    typeof raw.suggestedRewrite === 'string'
      ? raw.suggestedRewrite
      : typeof raw.suggested_rewrite === 'string'
        ? raw.suggested_rewrite
        : '';
  const bandStr = raw.bandScore != null ? String(raw.bandScore) : raw.overall_band != null ? String(raw.overall_band) : '';
  const bandNum = parseFloat(bandStr.replace(/[^\d.]/g, ''));
  const overall_band = Number.isFinite(bandNum) ? bandNum : null;
  const scoreForCriteria = overall_band ?? 0;
  const wc = userText.trim().split(/\s+/).filter(Boolean).length;
  const subComment = 'See overall feedback.';
  return {
    overall_band,
    word_count: wc,
    improvement_strategy: feedback,
    criteria: {
      [taskCriteriaName]: { score: scoreForCriteria, comment: feedback || subComment },
      Coherence_and_Cohesion: { score: scoreForCriteria, comment: subComment },
      Lexical_Resource: { score: scoreForCriteria, comment: subComment },
      Grammatical_Range_and_Accuracy: { score: scoreForCriteria, comment: subComment },
    },
    errors: [],
    logical_errors: [],
    highlights: [],
    corrections: [],
    lexical_upgrade: [],
    analysis: {
      linking_words: { score: 0, found: [], suggestions: [] },
      word_repetition: [],
    },
    suggested_rewrite: suggested,
  };
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Prefer Node http(s) — global fetch/Undici often throws "fetch failed" for some CDNs on Windows. */
function downloadImageAsDataUrl(imageUrl, redirectCount = 0) {
  if (redirectCount > 10) {
    return Promise.reject(new Error('Too many redirects while fetching image'));
  }

  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new NodeURL(imageUrl);
    } catch {
      reject(new Error('Invalid image URL'));
      return;
    }

    const lib = parsed.protocol === 'https:' ? https : parsed.protocol === 'http:' ? http : null;
    if (!lib) {
      reject(new Error('Only http(s) image URLs are supported'));
      return;
    }

    const req = lib.request(
      imageUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StratumIELTS/1.0)',
          Accept: 'image/*,*/*;q=0.8',
        },
        timeout: 60_000,
      },
      (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc) {
          res.resume();
          const nextUrl = new NodeURL(loc, imageUrl).href;
          downloadImageAsDataUrl(nextUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
          return;
        }

        const rawType = (res.headers['content-type'] || '').split(';')[0].trim();
        const chunks = [];
        let total = 0;

        res.on('data', (chunk) => {
          total += chunk.length;
          if (total > MAX_IMAGE_BYTES) {
            res.destroy();
            reject(new Error('Image is too large'));
            return;
          }
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            let contentType =
              rawType && rawType.startsWith('image/') ? rawType : '';
            if (!contentType) {
              const b0 = buffer[0];
              const b1 = buffer[1];
              if (b0 === 0xff && b1 === 0xd8) contentType = 'image/jpeg';
              else if (b0 === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') contentType = 'image/png';
              else if (b0 === 0x47 && b1 === 0x49) contentType = 'image/gif';
              else if (b0 === 0x52 && b1 === 0x49) contentType = 'image/webp';
              else contentType = 'application/octet-stream';
            }
            resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Image fetch timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

async function imageUrlToBase64(url) {
  try {
    return await downloadImageAsDataUrl(url);
  } catch (nodeErr) {
    console.warn('[/api/check] imageUrlToBase64: Node http(s) failed, trying fetch:', nodeErr?.message);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StratumIELTS/1.0)' },
      });

      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

      const contentType = response.headers.get('content-type');
      const ct = contentType ? contentType.split(';')[0].trim() : '';
      if (!ct || !ct.startsWith('image/')) {
        throw new Error(`Invalid MIME type: ${contentType || '(none)'}. Expected an image.`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image is too large');
      return `data:${ct};base64,${buffer.toString('base64')}`;
    } catch (fetchErr) {
      console.error('[/api/check] imageUrlToBase64: fetch failed:', fetchErr?.message);
      throw fetchErr;
    }
  }
}

export async function DELETE(req) {
  return NextResponse.json({ message: "Archive cleared" }, { status: 200 });
}
export async function POST(req) {
  try {
    // Debug: confirm request reaches this route (never log full secrets).
    const _rawKey = process.env.OPENAI_API_KEY || '';
    const _trimKey = typeof _rawKey === 'string' ? _rawKey.trim() : '';
    console.log('[/api/check] POST start', {
      hasKey: _trimKey.length > 0,
      keyLast4: _trimKey ? _trimKey.slice(-4) : null,
      baseURL: getOpenAIBaseURL(),
      nodeEnv: process.env.NODE_ENV,
      time: new Date().toISOString(),
    });

    // Single trimmed key so we never use raw env (avoids hidden \r or spaces). If you still see wrong key, it's from another source.
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Environment variable NOT LOADED" }, { status: 401 });
    }
    if (apiKey.slice(-4) === 'nTkA') {
      const msg = "Invalid or old API key (ends with nTkA). Get a new key at https://platform.openai.com/api-keys, set OPENAI_API_KEY in .env.local, and restart the dev server. If you already updated .env.local, unset the variable in your shell first (PowerShell: $env:OPENAI_API_KEY=''; then npm run dev).";
      if (process.env.NODE_ENV !== 'production') {
        console.warn(msg);
      }
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log("DEBUG: OpenAI request attempt; project:", process.env.OPENAI_PROJECT_ID || '(none)');
    }
    const body = await req.json();
    console.log('[/api/check] request body flags', {
      describeImage: Boolean(body?.describeImage),
      hasImage: Boolean(body?.image),
      hasEssay1: typeof body?.essay1 === 'string' && body.essay1.trim().length > 0,
      hasEssay2: typeof body?.essay2 === 'string' && body.essay2.trim().length > 0,
      analysisMode: body?.analysisMode,
    });
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
      const describeMessages = (imageUrlForApi) => [
        {
          role: 'system',
          content: `You write the QUESTION STEM for IELTS Academic Writing Task 1 — not the candidate's answer.

Output ONLY 1–2 short sentences that introduce the visual: name the chart/graph/table/map/process type and the general subject (what is measured or shown).

FORBIDDEN in your output:
- Any numbers, percentages, years used as data, or quantities (e.g. "52,000", "60%", "doubled").
- Trend or analysis language: rise, fall, peak, highest, lowest, compared, whereas, while X, overall trend, illustrates that (followed by interpretation).
- More than two sentences, bullet lists, or multiple paragraphs.
- The instruction line "Summarize the information..." (it is added by the app).

If a safe neutral intro is impossible, reply exactly: NONE`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Write the introductory stem only. Do not write the essay or report.',
            },
            { type: 'image_url', image_url: { url: imageUrlForApi } },
          ],
        },
      ];
      try {
        const rawImage = typeof body.image === "string" ? body.image.trim() : "";
        const isPublicHttp = /^https?:\/\//i.test(rawImage);

        let response;
        // Let OpenAI fetch public URLs first (avoids our server download + huge base64); fallback if it fails.
        if (isPublicHttp) {
          try {
            response = await openai.chat.completions.create(
              {
                model: "gpt-4o",
                messages: describeMessages(rawImage),
                max_tokens: 220,
              },
              { timeout: 180_000 }
            );
          } catch (directErr) {
            console.warn(
              "[/api/check] describeImage: vision with public URL failed, trying downloaded image:",
              directErr?.message || directErr
            );
            const finalImage = await imageUrlToBase64(rawImage);
            response = await openai.chat.completions.create(
              {
                model: "gpt-4o",
                messages: describeMessages(finalImage),
                max_tokens: 220,
              },
              { timeout: 180_000 }
            );
          }
        } else {
          response = await openai.chat.completions.create(
            {
              model: "gpt-4o",
              messages: describeMessages(body.image),
              max_tokens: 220,
            },
            { timeout: 180_000 }
          );
        }

        const rawIntro = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(
          typeof rawIntro === 'string' ? rawIntro : ''
        );
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;

        return NextResponse.json({ question });
      } catch (error) {
        console.error(
          "OpenAI error (describeImage):",
          error?.response ?? error?.error ?? error?.message,
          "response?.data:",
          error?.response?.data ?? error?.error
        );
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You write ONLY the written description that appears above the task instructions on an IELTS Academic Task 1 paper.

Return 2–4 sentences that describe a hypothetical chart, table, map, or process (type + what it shows). Do NOT invent specific numbers. Do NOT write the candidate's report, overview of trends, or analysis.

Do NOT include "Summarize the information" or "Write at least 150 words".`,
            },
            { role: 'user', content: 'Generate a new Academic Task 1 written prompt (description only).' },
          ],
          max_tokens: 220,
        });
        const raw = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(typeof raw === 'string' ? raw : '');
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;
        return NextResponse.json({ question });
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
    const userId = session?.user?.id || null;
    const prisma = userId ? getPrisma() : null;

    /**
     * Persist check + decrement credits only when the DB user exists and has credits.
     * - Missing user row (stale session): still run analysis, do not 403.
     * - Out of credits in production: 403 (charge model).
     * - Out of credits in development: still run analysis, skip save/decrement (local testing).
     */
    let persistAfterCheck = false;
    if (userId && prisma) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.warn('[/api/check] Session user not in DB; running analysis without save.', { userId });
      } else {
        const hasCredits = user.credits == null || user.credits >= 1;
        if (!hasCredits) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[/api/check] Dev: zero credits — analysis allowed; history/credits unchanged.');
          } else {
            return NextResponse.json(
              { error: 'You have run out of credits. Please refill to continue.' },
              { status: 403 }
            );
          }
        } else {
          persistAfterCheck = true;
        }
      }
    }
    const clientResult = getOpenAIClient();
    if (clientResult.error) return clientResult.error;
    const openai = clientResult.openai;

    const examinerSystemPrompt = buildIeltsCheckSystemPrompt(taskCriteriaName, isT1);

    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        // Full rubric + errors[] easily exceeds 1400 tokens; truncation breaks JSON mid-string.
        max_tokens: 8192,
        messages: [
          { role: "system", content: examinerSystemPrompt },
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

    const choice0 = response?.choices?.[0];
    const finishReason = choice0?.finish_reason;
    const rawContent = choice0?.message?.content;

    if (finishReason === 'length') {
      return NextResponse.json(
        {
          error:
            'The analysis hit the output limit and was cut off. Please click Analyze again, or shorten a very long essay.',
        },
        { status: 502 }
      );
    }

    const parsed = parseExaminerJson(rawContent);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          error:
            'The examiner returned incomplete or invalid data (often after a truncated response). Please run Analyze again, or try a slightly shorter essay.',
        },
        { status: 502 }
      );
    }

    let result = parsed.data;
    if (isSimplifiedCheckResult(result)) {
      result = normalizeSimplifiedCheckResult(result, taskCriteriaName, userText);
    }
    result.word_count = result.word_count ?? userText.trim().split(/\s+/).filter(Boolean).length;
    if (!Array.isArray(result.highlights)) result.highlights = [];
    result.highlights = result.highlights.map(h => ({
      ...h,
      type: ['grammar', 'lexical', 'cohesion', 'logic'].includes(h.type) ? h.type : (h.type === 'error' ? 'grammar' : 'lexical')
    }));
    if (!Array.isArray(result.corrections)) result.corrections = [];
    result.corrections = result.corrections.map(c => ({
      ...c,
      category: c.category || c.rule || 'General',
      impact: c.impact || 'medium',
      band_descriptor: c.band_descriptor || ''
    }));
    if (!Array.isArray(result.lexical_upgrade)) result.lexical_upgrade = [];
    if (!Array.isArray(result.logical_errors)) result.logical_errors = [];
    result.logical_errors = result.logical_errors.map((e) => ({
      phrase: typeof e?.phrase === 'string' ? e.phrase : typeof e?.text === 'string' ? e.text : '',
      explanation: typeof e?.explanation === 'string' ? e.explanation : typeof e?.reason === 'string' ? e.reason : '',
      criterion:
        typeof e?.criterion === 'string'
          ? e.criterion
          : isT1
            ? 'Task Achievement'
            : 'Task Response',
    }));
    if (!Array.isArray(result.errors)) result.errors = [];

    const mergedErrors = mergeUnifiedErrors(result);
    result.errors = mergedErrors;
    result.corrections = correctionsFromErrors(mergedErrors);
    result.highlights = [];

    const typeValue = isT1 ? 'TASK_1' : 'TASK_2';
    const savedScore = Number.isFinite(Number(result?.overall_band)) ? Number(result.overall_band) : null;

    // Run create and update separately to avoid transaction timeout (e.g. "Unable to start a transaction in the given time").
    // Ensure DATABASE_URL / DIRECT_URL in .env.local is correct and reachable (VPN/network).
    if (persistAfterCheck && userId && prisma) {
      const savedCheck = await prisma.check.create({
        data: {
          type: typeValue,
          content: userText,
          promptText: promptText || null,
          score: savedScore,
          feedback: JSON.stringify(result),
          userId,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      });
      return NextResponse.json({ ...result, savedId: savedCheck.id });
    }

    // Guest or dev zero-credits: return analysis without saving to DB / decrementing credits.
    return NextResponse.json({ ...result, savedId: null });
  } catch (error) {
    console.error("API ERROR:", error);
    if (isOpenAIAuthError(error)) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message || 'Server error.' }, { status: 500 });
  }
}

