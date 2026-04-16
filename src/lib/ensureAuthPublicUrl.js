/**
 * Auth.js v5: AUTH_URL / NEXTAUTH_URL must be the **site origin only** (e.g. http://localhost:3000).
 * Any path (including /api/auth or /en) makes next-auth/lib/env.js derive a wrong basePath → error=Configuration.
 *
 * Do **not** auto-set localhost when unset: Next may show Network as http://10.x.x.x:3000; forcing localhost
 * breaks OAuth PKCE cookies when the browser uses the LAN IP (reqWithEnvURL vs real Host mismatch).
 * Set AUTH_URL explicitly to the origin you open in the browser (localhost or IP), and add that redirect URI in Google Cloud.
 */
export function ensureAuthPublicUrl() {
  if (typeof process === "undefined") return;

  const raw = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").replace(/^\uFEFF/, "").trim();
  // In production (e.g. Vercel), AUTH_URL/NEXTAUTH_URL is sometimes not set.
  // Prefer the platform-provided public hostname, but never override an explicit setting.
  if (!raw) {
    const vercel = (process.env.VERCEL_URL || "").trim();
    if (vercel) {
      const originOnly = `https://${vercel.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
      process.env.AUTH_URL = originOnly;
      process.env.NEXTAUTH_URL = originOnly;
    }
    return;
  }

  try {
    const hasProto = /^https?:\/\//i.test(raw);
    const withProto = hasProto
      ? raw
      : /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw.trim())
        ? `http://${raw}`
        : `https://${raw}`;
    const u = new URL(withProto);
    const originOnly = `${u.protocol}//${u.host}`;
    // If deployed on Vercel but env mistakenly points to localhost,
    // override to the real public hostname to avoid Auth.js Configuration errors.
    const vercel = (process.env.VERCEL_URL || "").trim();
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(originOnly);
    if (vercel && isLocalhost && process.env.NODE_ENV !== "development") {
      const vercelOrigin = `https://${vercel.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
      process.env.AUTH_URL = vercelOrigin;
      process.env.NEXTAUTH_URL = vercelOrigin;
    } else {
      process.env.AUTH_URL = originOnly;
      process.env.NEXTAUTH_URL = originOnly;
    }
  } catch {
    let base = raw.replace(/\/+$/, "");
    if (base.endsWith("/api/auth")) {
      base = base.slice(0, -"/api/auth".length).replace(/\/+$/, "");
    }
    if (/^https?:\/\//i.test(base)) {
      process.env.AUTH_URL = base;
      process.env.NEXTAUTH_URL = base;
    }
  }
}
