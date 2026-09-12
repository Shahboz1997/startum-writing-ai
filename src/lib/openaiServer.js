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
 * @returns {NextResponse|null} 401 response or null if OK
 */
export function validateOpenAIEnvForRoute() {
  const apiKey = getTrimmedOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `OPENAI_API_KEY is not loaded. ${openAIEnvHint()}`,
        code: 'MISSING_API_KEY',
      },
      { status: 401 }
    );
  }
  if (isPlaceholderOpenAiKey(apiKey)) {
    return NextResponse.json(
      {
        error: `OPENAI_API_KEY looks like a placeholder. ${openAIEnvHint()}`,
        code: 'INVALID_API_KEY',
      },
      { status: 401 }
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
    return NextResponse.json(
      {
        error:
          process.env.VERCEL === '1'
            ? 'OPENAI_PROJECT_ID does not match OPENAI_API_KEY on Vercel. Remove OPENAI_PROJECT_ID or set the project ID from the same OpenAI project as the key, then redeploy.'
            : 'OPENAI_PROJECT_ID does not match OPENAI_API_KEY. Remove OPENAI_PROJECT_ID from .env.local or set the project ID from the same OpenAI project as the key, then restart npm run dev.',
        code: 'MISMATCHED_PROJECT',
      },
      { status: 401 }
    );
  }

  if (code === 'model_not_found' || /does not have access to model/i.test(msg)) {
    return NextResponse.json(
      {
        error:
          process.env.VERCEL === '1'
            ? 'OpenAI project has no speech models enabled. Voice now falls back to Replicate when REPLICATE_API_TOKEN is set — redeploy after adding it, or enable tts-1 in OpenAI → Project → Limits.'
            : 'OpenAI project has no access to speech models. Set REPLICATE_API_TOKEN in .env.local (recommended), or enable tts-1 in the OpenAI project, then restart npm run dev.',
        code: 'MODEL_NOT_FOUND',
      },
      { status: 403 }
    );
  }

  if (isOpenAIAuthError(err)) {
    return NextResponse.json(
      {
        error: `OpenAI rejected the API key. ${openAIEnvHint()}`,
        code: 'INVALID_API_KEY',
      },
      { status: 401 }
    );
  }

  if (
    code === 'unsupported_country_region_territory' ||
    /country, region, or territory not supported/i.test(msg)
  ) {
    return NextResponse.json(
      {
        error:
          'OpenAI is not available from your region. Use a VPN or set OPENAI_BASE_URL in .env.local to a supported proxy endpoint, then restart npm run dev.',
        code: 'OPENAI_REGION_BLOCKED',
      },
      { status: 503 }
    );
  }

  if (msg) {
    return NextResponse.json(
      {
        error: msg.replace(/^\d{3}\s+/, ''),
        code: code || 'OPENAI_ERROR',
      },
      { status: 502 }
    );
  }

  return null;
}
