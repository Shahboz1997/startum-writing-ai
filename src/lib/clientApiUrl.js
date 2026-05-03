/**
 * Absolute URL for same-origin API calls in the browser.
 * Uses NEXT_PUBLIC_APP_URL when set; otherwise the current page origin (LAN vs localhost).
 */
export function clientApiUrl(path) {
  const p = String(path ?? "");
  const norm = p.startsWith("/") ? p : `/${p}`;
  if (typeof window === "undefined") return norm;
  const forced = String(process.env.NEXT_PUBLIC_APP_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (forced) {
    try {
      return new URL(norm, forced.endsWith("/") ? forced : `${forced}/`).toString();
    } catch {
      return `${forced}${norm}`;
    }
  }
  return `${window.location.origin}${norm}`;
}
