export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import OpenAI from 'openai';
import https from 'https';
import http from 'http';
import { URL as NodeURL } from 'url';
import {
  IELTS_TASK1_STANDARD_INSTRUCTION,
  buildTask1QuestionPaperText,
} from '@/lib/task1Prompt.js';
import { normalizeSubtopic } from '@/lib/errorSubtopics.js';
import { writingProfileTag } from '@/lib/writingProfileCache.js';
import { CREDITS_EXHAUSTED_CODE } from '@/lib/credits';
import { SUPPORT_EMAIL } from '@/lib/support';

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
    const expl =
      explanation ||
      (type === 'logic'
        ? 'This issue affects Task Achievement or Task Response and may lower your band.'
        : 'See criterion feedback for impact on your band score.');
    byKey.set(key, {
      original,
      type,
      subtopic: normalizeSubtopic(row.subtopic, type, expl),
      fixed: fixed || suggestion,
      suggestion: suggestion || fixed,
      explanation: expl,
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
  "subtopic": "REQUIRED — pick ONE id: for grammar use tense_aspect | articles | prepositions | agreement | word_order | punctuation | spelling | other_grammar; for lexical use collocation | register | repetition | word_choice | other_lexical; for logic use data_contradiction | overview | task_alignment | other_logic",
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

ADDITIONAL REQUIREMENT (Task 1 only):
Return a "task1_strategy" object that focuses on STRUCTURE and GROUPING (not grammar). It must be actionable and brief:
- Recommend the ideal paragraph plan (Intro / Overview / Body 1 / Body 2).
- Propose how to GROUP information into 2 Body paragraphs (e.g., highest vs lowest; increasing vs decreasing; early vs late; categories A+B vs C+D).
- If the student's structure is weak (e.g., 3 body paragraphs with an empty/underdeveloped one), state why and how to fix it.
- Give 3–6 quick, concrete fixes (comparisons, overview, avoid listing).
Schema:
"task1_strategy": {
  "recommended_body_count": 2,
  "paragraph_plan": ["Intro", "Overview", "Body 1", "Body 2"],
  "grouping_plan": [
    { "label": "Body 1", "focus": "string", "comparisons_to_make": ["string", "string"] },
    { "label": "Body 2", "focus": "string", "comparisons_to_make": ["string", "string"] }
  ],
  "what_to_fix": ["string", "string", "string"]
}

CRITICAL (Task 1 only): Your "suggested_rewrite" MUST follow "task1_strategy":
- Use exactly: Intro + Overview + 2 Body paragraphs (unless the prompt is a process/diagram where grouping differs; still keep 4 paragraphs).
- Ensure each Body paragraph has explicit comparisons and avoids pure listing.
Do not add personal opinion or conclusions in Task 1.

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

ADDITIONAL REQUIREMENT (Task 2 only):
Return an "idea_development" object that evaluates DEPTH of ideas, not grammar/wording. It must be practical and specific:
- Identify each paragraph's main idea (1 short clause).
- Explain what's missing (mechanism / example / impact / link to prompt).
- Provide 1–2 concrete upgrade suggestions per paragraph (each 1 sentence), focusing on adding depth (cause→effect, psychological/social/economic mechanism, specific example).
- Keep it short: total <= 220 words across the whole idea_development object.
Schema:
"idea_development": {
  "overall": { "score_0_5": 0, "summary": "string (1–2 sentences)" },
  "paragraphs": [
    {
      "label": "Introduction" | "Body 1" | "Body 2" | "Conclusion" | "Other",
      "main_idea": "string",
      "missing": ["mechanism" | "example" | "impact" | "link_to_prompt" | "specificity"],
      "upgrades": ["string", "string"]
    }
  ]
}

CRITICAL (Task 2 only): Your "suggested_rewrite" MUST reflect the idea depth feedback you gave in "idea_development".
- If a body paragraph is missing "mechanism": add 1–2 causal links (why/how → effect) using clear cause→effect logic.
- If missing "example": add one specific mini-example (realistic scenario; 1–2 sentences).
- If missing "impact": add a concrete consequence (psychological / social / economic) that links back to the prompt.
- If missing "link_to_prompt": add an explicit sentence that ties the paragraph back to the question.
Do not bloat the essay: improve depth efficiently, without adding new unrelated ideas.

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
      "subtopic": "tense_aspect | articles | prepositions | agreement | word_order | punctuation | spelling | other_grammar | collocation | register | repetition | word_choice | other_lexical | data_contradiction | overview | task_alignment | other_logic",
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
  "task1_strategy": {
    "recommended_body_count": 2,
    "paragraph_plan": ["Intro", "Overview", "Body 1", "Body 2"],
    "grouping_plan": [
      { "label": "Body 1", "focus": "string", "comparisons_to_make": ["string"] },
      { "label": "Body 2", "focus": "string", "comparisons_to_make": ["string"] }
    ],
    "what_to_fix": ["string"]
  },
  "idea_development": {
    "overall": { "score_0_5": 0, "summary": "string" },
    "paragraphs": [
      { "label": "Body 1", "main_idea": "string", "missing": ["mechanism"], "upgrades": ["string"] }
    ]
  },
  "suggested_rewrite": "Intro with <mark>improved phrasing</mark>.\\n\\nBody...\\n\\nClosing..."
}

Rules: Whenever the essay has issues, list them in **errors** with **type** ∈ { grammar, logic, lexical }. Use [] only if the essay is genuinely flawless. You MUST also return the **checklist** object with ALL required boolean keys (no missing keys, no nulls, no strings). You may leave **logical_errors**, **highlights**, and **corrections** as empty arrays — the app merges legacy fields if present. Be rigorous; scores must match official descriptor limits.
For Task 1 only, you MUST include "task1_strategy" with the required keys. For Task 2 only, you MUST include "idea_development" with the required keys.`; 
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
const MAX_DATA_URL_CHARS = 10_000_000; // ~7.5MB base64 payload depending on header

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
    // Footer feedback is handled by POST /api/feedback (no OpenAI key required).
    // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision / OCR) ---
    // Frontend sends POST with { describeImage: true, image: base64OrUrl }. API key is read at request time via getOpenAIClient().
    if (body.describeImage && body.image) {
      const rawImage = typeof body.image === 'string' ? body.image.trim() : '';
      if (!rawImage) {
        return NextResponse.json({ error: 'Missing image.' }, { status: 400 });
      }
      if (rawImage.startsWith('data:')) {
        if (!rawImage.startsWith('data:image/')) {
          return NextResponse.json({ error: 'Unsupported data URL type. Please upload a valid image.' }, { status: 400 });
        }
        if (rawImage.length > MAX_DATA_URL_CHARS) {
          return NextResponse.json({ error: 'Image is too large. Please upload a smaller image (under ~6MB).' }, { status: 413 });
        }
      }

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
        const upstreamStatus = error?.status ?? error?.statusCode ?? error?.response?.status;
        const message =
          typeof error?.message === 'string' && error.message
            ? error.message
            : 'Image description failed.';
        return NextResponse.json(
          {
            error:
              upstreamStatus === 400
                ? 'Invalid image for vision. Please try another image.'
                : 'The selected image source is protected, too large, or invalid. Please upload a smaller file or try another topic.',
            detail: process.env.NODE_ENV === 'development' ? message : undefined,
            question: null,
          },
          { status: 502 }
        );
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

    let persistAfterCheck = false;
    if (userId && prisma) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.warn('[/api/check] Session user not in DB; running analysis without save.', { userId });
      } else {
        const hasCredits = user.credits == null || user.credits >= 1;
        if (!hasCredits) {
          return NextResponse.json(
            {
              code: CREDITS_EXHAUSTED_CODE,
              error:
                'You have used your included checks and have no credits left. Analysis is not available until you top up. For credit purchases and billing questions, use the support email shown in the site footer.',
              supportEmail: SUPPORT_EMAIL,
            },
            { status: 403 }
          );
        }
        persistAfterCheck = true;
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

    // Task 1: normalize strategy block (backward-compatible).
    if (isT1) {
      const strat = result?.task1_strategy;
      const groupingRaw = Array.isArray(strat?.grouping_plan) ? strat.grouping_plan : [];
      const planRaw = Array.isArray(strat?.paragraph_plan) ? strat.paragraph_plan : [];
      const fixRaw = Array.isArray(strat?.what_to_fix) ? strat.what_to_fix : [];
      const recBody = Number(strat?.recommended_body_count);
      const safeRecBody = Number.isFinite(recBody) ? Math.max(1, Math.min(3, Math.round(recBody))) : 2;

      const cleanList = (arr, max) =>
        (arr || [])
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean)
          .slice(0, max);

      const normalizeLabel = (x, fallback) => {
        const s = String(x || '').trim();
        if (!s) return fallback;
        const lower = s.toLowerCase();
        if (lower.includes('body 1') || lower.includes('body1')) return 'Body 1';
        if (lower.includes('body 2') || lower.includes('body2')) return 'Body 2';
        return fallback;
      };

      const defaultPlan = ['Intro', 'Overview', 'Body 1', 'Body 2'];

      result.task1_strategy = {
        recommended_body_count: safeRecBody,
        paragraph_plan: cleanList(planRaw, 6).length > 0 ? cleanList(planRaw, 6) : defaultPlan,
        grouping_plan: (groupingRaw.length > 0 ? groupingRaw : [{ label: 'Body 1' }, { label: 'Body 2' }])
          .slice(0, 2)
          .map((g, idx) => {
            const fallback = idx === 0 ? 'Body 1' : 'Body 2';
            return {
              label: normalizeLabel(g?.label, fallback),
              focus: typeof g?.focus === 'string' ? g.focus.trim() : '',
              comparisons_to_make: cleanList(g?.comparisons_to_make, 4),
            };
          }),
        what_to_fix:
          cleanList(fixRaw, 8).length > 0
            ? cleanList(fixRaw, 8)
            : [
                'Write a clear overview (main trends / highest vs lowest) without listing all numbers.',
                'Use 2 body paragraphs with grouping; avoid a third weak body paragraph.',
                'Prioritise comparisons (higher/lower, larger/smaller, overtook, widened/narrowed gap) over pure listing.',
              ],
      };
    }

    // Task 2: normalize idea development block (optional for older model outputs / backward compatibility).
    if (!isT1) {
      const idea = result?.idea_development;
      const score = Number(idea?.overall?.score_0_5);
      const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(5, Math.round(score))) : 0;
      const summary = typeof idea?.overall?.summary === 'string' ? idea.overall.summary.trim() : '';
      const parasRaw = Array.isArray(idea?.paragraphs) ? idea.paragraphs : [];
      const allowedMissing = new Set(['mechanism', 'example', 'impact', 'link_to_prompt', 'specificity']);
      const normalizeLabel = (x) => {
        const s = String(x || '').trim();
        if (!s) return 'Other';
        const lower = s.toLowerCase();
        if (lower.startsWith('intro')) return 'Introduction';
        if (lower.includes('body 1') || lower.includes('body1')) return 'Body 1';
        if (lower.includes('body 2') || lower.includes('body2')) return 'Body 2';
        if (lower.startsWith('concl')) return 'Conclusion';
        return ['Introduction', 'Body 1', 'Body 2', 'Conclusion', 'Other'].includes(s) ? s : 'Other';
      };
      result.idea_development = {
        overall: {
          score_0_5: safeScore,
          summary: summary || (safeScore >= 4 ? 'Ideas are generally well-developed; add one more concrete example for maximum impact.' : 'Some ideas need deeper development (mechanism, example, and impact) to strengthen Task Response.'),
        },
        paragraphs: parasRaw
          .map((p) => {
            const main_idea = typeof p?.main_idea === 'string' ? p.main_idea.trim() : '';
            const missingArr = Array.isArray(p?.missing) ? p.missing : [];
            const missing = missingArr
              .map((m) => String(m || '').trim())
              .filter((m) => allowedMissing.has(m))
              .slice(0, 5);
            const upgradesArr = Array.isArray(p?.upgrades) ? p.upgrades : [];
            const upgrades = upgradesArr
              .map((u) => (typeof u === 'string' ? u.trim() : ''))
              .filter(Boolean)
              .slice(0, 2);
            return {
              label: normalizeLabel(p?.label),
              main_idea: main_idea || '',
              missing,
              upgrades,
            };
          })
          .filter((p) => p.main_idea || p.upgrades.length > 0 || (p.missing && p.missing.length > 0))
          .slice(0, 6),
      };
    }

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
      try {
        revalidateTag(writingProfileTag(userId));
      } catch (_) {}
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

