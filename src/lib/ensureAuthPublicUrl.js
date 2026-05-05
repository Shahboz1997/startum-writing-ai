/**
 * Auth.js v5: AUTH_URL / NEXTAUTH_URL must be the **site origin only** (e.g. http://localhost:3000).
 * Any path (including /api/auth or /en) makes next-auth derive a wrong basePath → error=Configuration.
 *
 * Do **not** auto-set localhost when unset: Next may show Network as http://10.x.x.x:3000; forcing localhost
 * breaks OAuth PKCE cookies when the browser uses the LAN IP (reqWithEnvURL vs real Host mismatch).
 * Set AUTH_URL explicitly to the origin you open in the browser (localhost or IP), and add that redirect URI in Google Cloud.
 */

function stripTrailingSlashes(s) {
  return String(s ?? "").replace(/\/+$/, "");
}

/** Host or origin → https://host (no path). */
function toHttpsOrigin(hostOrUrl) {
  let h = String(hostOrUrl ?? "").trim().replace(/^\uFEFF/, "").replace(/^:+/, "");
  if (!h) return "";
  h = h.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const hostOnly = h.split("/")[0] || "";
  if (!hostOnly) return "";
  return `https://${hostOnly}`;
}

function parseOriginOnly(raw) {
  const cleaned = normalizeEnvOrigin(raw);
  if (!cleaned) return "";
  const hasProto = /^https?:\/\//i.test(cleaned);
  const withProto = hasProto
    ? cleaned
    : /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(cleaned.trim())
      ? `http://${cleaned}`
      : `https://${cleaned}`;
  try {
    const u = new URL(withProto);
    return stripTrailingSlashes(`${u.protocol}//${u.host}`);
  } catch {
    let base = cleaned.replace(/\/+$/, "");
    if (base.endsWith("/api/auth")) {
      base = base.slice(0, -"/api/auth".length).replace(/\/+$/, "");
    }
    if (/^https?:\/\//i.test(base)) {
      try {
        const u = new URL(base);
        return stripTrailingSlashes(`${u.protocol}//${u.host}`);
      } catch {
        return "";
      }
    }
    return "";
  }
}

/**
 * Best public origin for this Vercel deployment (when env vars omit AUTH_URL).
 * Preview: always the current deployment host (VERCEL_URL).
 * Production: custom production host if Vercel exposes it, else deployment URL.
 */
function getVercelSuggestedOrigin() {
  if (!process.env.VERCEL) return "";
  const vercelEnv = process.env.VERCEL_ENV || "";
  const deploymentOrigin = toHttpsOrigin(process.env.VERCEL_URL || "");
  if (vercelEnv === "preview") {
    return deploymentOrigin;
  }
  const prodRaw = (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  if (prodRaw) {
    const fromEnv = parseOriginOnly(prodRaw);
    if (fromEnv) return fromEnv;
  }
  return deploymentOrigin;
}

export function ensureAuthPublicUrl() {
  if (typeof process === "undefined") return;

  const raw = normalizeEnvOrigin(process.env.AUTH_URL || process.env.NEXTAUTH_URL || "");
  const vercelSuggested = getVercelSuggestedOrigin();

  // Preview: using the **production** site origin in AUTH_URL breaks OAuth on this deployment (wrong redirect_uri).
  // Only replace when the configured origin matches the project's production hostname (VERCEL_PROJECT_PRODUCTION_URL).
  // Stable preview domains (e.g. preview.*.vercel.app) must NOT be overwritten with VERCEL_URL, or Google sees
  // redirect_uri_mismatch vs URLs registered for the preview alias.
  if (vercelSuggested && process.env.VERCEL_ENV === "preview" && raw) {
    const configured = parseOriginOnly(raw);
    if (configured) {
      try {
        const deploymentHost = new URL(vercelSuggested).host;
        const configuredHost = new URL(configured).host;

        const prodRaw = (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
        const prodConfigured = prodRaw ? parseOriginOnly(prodRaw) : "";
        const prodHost = prodConfigured ? new URL(prodConfigured).host : "";

        const mistakenProductionOrigin =
          prodHost.length > 0 && configuredHost === prodHost;

        if (mistakenProductionOrigin && configuredHost !== deploymentHost) {
          process.env.AUTH_URL = vercelSuggested;
          process.env.NEXTAUTH_URL = vercelSuggested;
        }
      } catch {
        /* ignore */
      }
    }
  }

  const effectiveRaw = normalizeEnvOrigin(process.env.AUTH_URL || process.env.NEXTAUTH_URL || "");

  if (!effectiveRaw) {
    if (vercelSuggested) {
      process.env.AUTH_URL = vercelSuggested;
      process.env.NEXTAUTH_URL = vercelSuggested;
    }
    return;
  }

  try {
    const hasProto = /^https?:\/\//i.test(effectiveRaw);
    const withProto = hasProto
      ? effectiveRaw
      : /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(effectiveRaw.trim())
        ? `http://${effectiveRaw}`
        : `https://${effectiveRaw}`;
    const u = new URL(withProto);
    const originOnly = stripTrailingSlashes(`${u.protocol}//${u.host}`);
    const vercel = (process.env.VERCEL_URL || "").trim();
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(originOnly);
    if (vercel && isLocalhost && process.env.NODE_ENV !== "development") {
      const vercelOrigin = toHttpsOrigin(vercel);
      process.env.AUTH_URL = vercelOrigin;
      process.env.NEXTAUTH_URL = vercelOrigin;
    } else {
      process.env.AUTH_URL = originOnly;
      process.env.NEXTAUTH_URL = originOnly;
    }
  } catch {
    let base = effectiveRaw.replace(/\/+$/, "");
    if (base.endsWith("/api/auth")) {
      base = base.slice(0, -"/api/auth".length).replace(/\/+$/, "");
    }
    if (/^https?:\/\//i.test(base)) {
      process.env.AUTH_URL = base;
      process.env.NEXTAUTH_URL = base;
    }
  }
}

function normalizeEnvOrigin(value) {
  const raw = String(value ?? "").replace(/^\uFEFF/, "").trim().replace(/^:+/, "");
  if (!raw) return "";
  const firstToken = raw.split(/\s+/)[0] || "";
  const withoutParens = firstToken.split("(")[0] || firstToken;
  let cleaned = withoutParens.trim().replace(/\/+$/, "");
  if (!cleaned) return "";
  if (cleaned.endsWith("/api/auth")) {
    cleaned = cleaned.slice(0, -"/api/auth".length).replace(/\/+$/, "");
  }
  return cleaned;
}
