/**
 * Public site origin (protocol + host, no path, no trailing slash).
 * Used for metadata, OG URLs, and absolute links — not for Auth.js (see ensureAuthPublicUrl).
 */

function toOrigin(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

/** From env / Vercel runtime; may be "" (caller can use a relative URL). */
export function resolvePublicSiteOrigin() {
  const fromEnv =
    toOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    toOrigin(process.env.AUTH_URL) ||
    toOrigin(process.env.NEXTAUTH_URL);
  if (fromEnv) return fromEnv;
  const v = String(process.env.VERCEL_URL ?? "").trim();
  if (v) return `https://${v}`;
  return "";
}

/**
 * Always a valid absolute origin for `metadataBase` / OG `url`.
 * Dev: prefers env, else localhost. Prod: prefers env/Vercel, else brand default.
 */
export function getMetadataBaseUrl() {
  const resolved = resolvePublicSiteOrigin();
  if (resolved) return resolved;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "https://stratum.ai";
}
