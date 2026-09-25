import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/** baseURL ends with /v1. Use OPENAI_BASE_URL in .env for a proxy. */
export function getOpenAIBaseURL() {
  const raw = process.env.OPENAI_BASE_URL;
  const base = typeof raw === 'string' ? raw.trim() : 'https://api.openai.com/v1';
  const url = base.length > 0 ? base : 'https://api.openai.com/v1';
  return url.endsWith('/v1') ? url : url.replace(/\/?$/, '') + '/v1';
}

export function getTrimmedOpenAIKey() {
  return (process.env.OPENAI_API_KEY || '').trim();
}

export function getTrimmedOpenAIProjectId() {
  return (process.env.OPENAI_PROJECT_ID || '').trim();
}

function openAIEnvHint() {
  return process.env.VERCEL === '1'
    ? 'Update OPENAI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.'
    : 'Add a valid OPENAI_API_KEY to .env.local and restart the dev server (npm run dev).';
}

/** Default naming: OPENAI_MODEL for text, OPENAI_VISION_MODEL for chart/image OCR */
export function getOpenAIModel() {
  return (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
}

export function getOpenAIVisionModel() {
  return (process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
}

/**
 * Chat models to try when the project blocks the preferred one (model_not_found).
 * Preferred first (OPENAI_MODEL or override), then common GPT-4o / 4.1 family.
 * @param {string} [preferredOverride]
 */
export function getOpenAIChatModelFallbacks(preferredOverride) {
  const preferred = String(preferredOverride || getOpenAIModel() || '').trim();
  const extras = String(process.env.OPENAI_MODEL_FALLBACKS || '')
    .split(/[,|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ['gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'];
  return [...new Set([preferred, ...extras, ...defaults].filter(Boolean))];
}

export function isOpenAIModelAccessError(err) {
  const code = err?.code ?? err?.error?.code;
  const msg = String(err?.message ?? err?.error?.message ?? '');
  return code === 'model_not_found' || /does not have access to model/i.test(msg);
}

/**
 * chat.completions.create with model fallbacks when the project blocks a model.
 * @param {import('openai').default} openai
 * @param {object} params - create args (model is overridden per attempt)
 * @param {{ preferredModel?: string, requestOptions?: object, label?: string }} [opts]
 */
export async function createChatCompletionWithModelFallback(openai, params, opts = {}) {
  const models = getOpenAIChatModelFallbacks(opts.preferredModel);
  let lastAccessErr = null;
  const blocked = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await openai.chat.completions.create(
        { ...params, model },
        opts.requestOptions
      );
    } catch (err) {
      if (isOpenAIModelAccessError(err)) {
        blocked.push(model);
        console.warn('[openai] model blocked, trying fallback', {
          label: opts.label,
          blocked: model,
          next: i < models.length - 1 ? models[i + 1] : null,
          message: err?.message || err?.error?.message,
        });
        lastAccessErr = err;
        if (i < models.length - 1) continue;
      }
      throw err;
    }
  }

  const exhausted = lastAccessErr || new Error('No OpenAI chat model available for this project');
  exhausted.triedModels = blocked.length ? blocked : models;
  exhausted.code = exhausted.code || 'model_not_found';
  throw exhausted;
}

function isSpeechModelName(model) {
  return /tts|whisper|speech|audio|realtime/i.test(String(model || ''));
}

function extractBlockedModelName(msg) {
  const m = String(msg || '').match(/model[`\s]+[`']?([A-Za-z0-9._-]+)/i);
  return m?.[1] || '';
}

/** Placeholder or obviously invalid keys from .env.example / local setup. */
export function isPlaceholderOpenAiKey(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) return true;
  if (key.length < 20) return true;
  // Only reject explicit example/placeholder patterns — never match by random suffix.
  if (/your-key|placeholder|example|changeme|xxx|sk-your-|\.\.\./i.test(key)) return true;
  if (!/^sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]+$/.test(key)) return true;
  return false;
}

/**
 * Dev-only mock when the configured key is still a placeholder.
 * E2E_MOCK_OPENAI is handled separately in /api/check (essay check only, not chart vision).
 */
export function shouldUseDevOpenAiMock() {
  if (process.env.NODE_ENV !== 'development') return false;
  return isPlaceholderOpenAiKey(getTrimmedOpenAIKey());
}

/**
 * Validates server OpenAI env before calling the API.
 * Uses 503 (not 401) so clients do not treat misconfigured server as "please sign in".
 * @returns {NextResponse|null} error response or null if OK
 */
export function validateOpenAIEnvForRoute() {
  const apiKey = getTrimmedOpenAIKey();
  const isProd = process.env.NODE_ENV === 'production';
  if (!apiKey) {
    return NextResponse.json(
      {
        error: isProd
          ? 'Analysis temporarily unavailable. Please try again shortly.'
          : `OPENAI_API_KEY is not loaded. ${openAIEnvHint()}`,
        code: 'MISSING_API_KEY',
      },
      { status: 503 }
    );
  }
  if (isPlaceholderOpenAiKey(apiKey)) {
    return NextResponse.json(
      {
        error: isProd
          ? 'Analysis temporarily unavailable. Please try again shortly.'
          : `OPENAI_API_KEY looks like a placeholder. ${openAIEnvHint()}`,
        code: 'INVALID_API_KEY',
      },
      { status: 503 }
    );
  }
  return null;
}

/**
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {{ openai: OpenAI } | { error: NextResponse }}
 */
export function createOpenAIClient(opts = {}) {
  const envError = validateOpenAIEnvForRoute();
  if (envError) return { error: envError };

  const apiKey = getTrimmedOpenAIKey();
  const project = getTrimmedOpenAIProjectId();
  const organization = (process.env.OPENAI_ORG_ID || '').trim();

  const client = new OpenAI({
    apiKey,
    baseURL: getOpenAIBaseURL(),
    project: project || undefined,
    organization: organization || undefined,
    maxRetries: 4,
    timeout: 600_000,
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  });

  return { openai: client };
}

export function isOpenAIAuthError(err) {
  if (!err) return false;
  const status = err.status ?? err.statusCode ?? err.response?.status;
  const code = err.code ?? err.error?.code;
  const msg = (err.message || err.error?.message || '').toLowerCase();

  // Model/project access issues are NOT auth failures (handled separately).
  if (code === 'model_not_found' || /does not have access to model/i.test(msg)) {
    return false;
  }

  return (
    status === 401 ||
    code === 'invalid_api_key' ||
    code === 'authentication_error' ||
    /incorrect api key|invalid api key|api key.*(invalid|incorrect|revoked)/i.test(msg) ||
    code === 'mismatched_project' ||
    /openai-project|mismatched.?project/i.test(msg)
  );
}

function openAIErrorMessage(err) {
  return String(err?.message ?? err?.error?.message ?? '').trim();
}

function openAIErrorCode(err) {
  return err?.code ?? err?.error?.code ?? null;
}

/**
 * Map OpenAI SDK / HTTP failures to a JSON response for API routes.
 * @returns {NextResponse|null}
 */
export function openAIErrorToJsonResponse(err) {
  const code = openAIErrorCode(err);
  const msg = openAIErrorMessage(err);

  if (code === 'mismatched_project') {
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: isProd
          ? 'Analysis temporarily unavailable. Please try again shortly.'
          : process.env.VERCEL === '1'
            ? 'OPENAI_PROJECT_ID does not match OPENAI_API_KEY on Vercel. Remove OPENAI_PROJECT_ID or set the project ID from the same OpenAI project as the key, then redeploy.'
            : 'OPENAI_PROJECT_ID does not match OPENAI_API_KEY. Remove OPENAI_PROJECT_ID from .env.local or set the project ID from the same OpenAI project as the key, then restart npm run dev.',
        code: 'MISMATCHED_PROJECT',
      },
      { status: 503 }
    );
  }

  if (code === 'model_not_found' || /does not have access to model/i.test(msg)) {
    const blocked = extractBlockedModelName(msg);
    const speech = isSpeechModelName(blocked);
    const tried = Array.isArray(err?.triedModels)
      ? err.triedModels.filter(Boolean)
      : [];
    const modelLabel = blocked ? `\`${blocked}\`` : 'the requested model';

    let error;
    if (speech) {
      error =
        process.env.VERCEL === '1'
          ? 'OpenAI project has no speech models enabled. Voice falls back to Replicate when REPLICATE_API_TOKEN is set — redeploy after adding it, or enable tts-1 in OpenAI → Project → Limits.'
          : 'OpenAI project has no access to speech models. Set REPLICATE_API_TOKEN in .env.local (recommended), or enable tts-1 in the OpenAI project, then restart npm run dev.';
    } else if (tried.length > 1) {
      error =
        process.env.VERCEL === '1'
          ? `OpenAI project has no chat/vision models enabled (tried: ${tried.join(', ')}). In OpenAI → Project → Limits enable gpt-4o or gpt-4o-mini, then redeploy.`
          : `OpenAI project has no chat/vision models enabled (tried: ${tried.join(', ')}). In OpenAI → Project → Limits enable gpt-4o or gpt-4o-mini, then restart npm run dev.`;
    } else {
      error =
        process.env.VERCEL === '1'
          ? `OpenAI project has no access to ${modelLabel}. Enable it in OpenAI → Project → Limits, or set OPENAI_MODEL to a model this project allows, then redeploy.`
          : `OpenAI project has no access to ${modelLabel}. Enable it in OpenAI → Project → Limits, or set OPENAI_MODEL (e.g. gpt-4o) in .env.local to a model this project allows, then restart npm run dev.`;
    }

    return NextResponse.json(
      {
        error,
        code: 'MODEL_NOT_FOUND',
        model: blocked || undefined,
        triedModels: tried.length ? tried : undefined,
      },
      { status: 403 }
    );
  }

  if (isOpenAIAuthError(err)) {
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: isProd
          ? 'Analysis temporarily unavailable. Please try again shortly.'
          : `OpenAI rejected the API key. ${openAIEnvHint()}`,
        code: 'INVALID_API_KEY',
      },
      { status: 503 }
    );
  }

  if (
    code === 'unsupported_country_region_territory' ||
    /country, region, or territory not supported/i.test(msg)
  ) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'production'
            ? 'Analysis temporarily unavailable from this region.'
            : 'OpenAI is not available from your region. Use a VPN or set OPENAI_BASE_URL in .env.local to a supported proxy endpoint, then restart npm run dev.',
        code: 'OPENAI_REGION_BLOCKED',
      },
      { status: 503 }
    );
  }

  // Never forward raw upstream messages to clients in production (noise / leak risk).
  if (msg) {
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: isProd
          ? 'Analysis temporarily unavailable. Please try again shortly.'
          : msg.replace(/^\d{3}\s+/, ''),
        code: code || 'OPENAI_ERROR',
      },
      { status: 502 }
    );
  }

  return null;
}
