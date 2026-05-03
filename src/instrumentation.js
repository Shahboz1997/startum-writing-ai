import { ensureAuthPublicUrl } from '@/lib/ensureAuthPublicUrl';

/**
 * Runs once when the Next.js server starts. Use for startup logging (e.g. env checks).
 * OPENAI_API_KEY is only read here for logging; actual usage is in app/api/... routes only.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  ensureAuthPublicUrl();

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  const status = apiKey.length > 0 ? 'loaded' : 'missing';

  const baseRaw = process.env.OPENAI_BASE_URL;
  const base = typeof baseRaw === 'string' ? baseRaw.trim() : '';
  const baseURL = base.length > 0 ? base : 'https://api.openai.com/v1';
  const baseURLNormalized = baseURL.endsWith('/v1') ? baseURL : baseURL.replace(/\/?$/, '') + '/v1';

  console.log('[Server start] OPENAI_API_KEY:', status);
  console.log('[Server start] OpenAI baseURL:', baseURLNormalized);

  if ((process.env.DATABASE_URL || process.env.DIRECT_URL || "").trim()) {
    void import("@/lib/prisma")
      .then(({ getPrisma }) => getPrisma().$queryRaw`SELECT 1`)
      .then(() => console.log("[Server start] DB: reachable"))
      .catch((e) =>
        console.warn("[Server start] DB warmup failed:", e?.message ?? e)
      );
  }
}
