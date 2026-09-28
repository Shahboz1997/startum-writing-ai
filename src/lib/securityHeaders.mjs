/**
 * HTTP security headers (checkvibe, securityheaders.com, OWASP).
 * DNS records (SPF/DMARC/DKIM) must be set at the domain registrar — see scripts/dns-security-records.txt
 */

const IS_PROD = process.env.NODE_ENV === 'production';

/** GA4 + Google Ads (gtag) — required for conversion / Tag Assistant. */
const GOOGLE_TAG_HOSTS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  'https://www.googleadservices.com',
  'https://www.google.com',
  'https://google.com',
  'https://googleads.g.doubleclick.net',
  'https://pagead2.googlesyndication.com',
  'https://tagassistant.google.com',
];

function uniqueJoin(parts) {
  return [...new Set(parts.filter(Boolean))].join(' ');
}

function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    uniqueJoin([
      "script-src 'self' 'unsafe-inline'",
      IS_PROD ? '' : "'unsafe-eval'",
      'https://va.vercel-scripts.com',
      'https://vercel.live',
      ...GOOGLE_TAG_HOSTS,
    ]),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data:",
    "font-src 'self' data:",
    uniqueJoin([
      "connect-src 'self'",
      'https://va.vercel-scripts.com',
      'https://vitals.vercel-insights.com',
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      'https://region1.google-analytics.com',
      'https://stats.g.doubleclick.net',
      'wss:',
      ...GOOGLE_TAG_HOSTS,
    ]),
    uniqueJoin([
      "frame-src 'self' blob:",
      'https://accounts.google.com',
      'https://www.googletagmanager.com',
      'https://td.doubleclick.net',
      'https://www.google.com',
    ]),
    // Allow same-origin PDF embeds in the in-site guide viewer (<object>/<embed>).
    "object-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
  ];

  if (IS_PROD) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/** @returns {Array<[string, string]>} */
export function getSecurityHeaderEntries() {
  const entries = [
    ['X-DNS-Prefetch-Control', 'off'],
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
    ['Cross-Origin-Opener-Policy', 'same-origin-allow-popups'],
    ['Cross-Origin-Resource-Policy', 'same-site'],
    ['X-XSS-Protection', '0'],
    ['Content-Security-Policy', buildContentSecurityPolicy()],
  ];

  if (IS_PROD) {
    entries.push([
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    ]);
  }

  return entries;
}

/** For next.config `headers()` — [{ key, value }, …] */
export function getSecurityHeadersForNextConfig() {
  return getSecurityHeaderEntries().map(([key, value]) => ({ key, value }));
}

/** CSP for /guides/*.pdf so the in-site desktop viewer can iframe them. */
function buildGuidePdfContentSecurityPolicy() {
  return buildContentSecurityPolicy().replace(
    "frame-ancestors 'none'",
    "frame-ancestors 'self'",
  );
}

/** Apply headers to a NextResponse (middleware). */
export function applySecurityHeaders(response, pathname = '') {
  const isGuidePdf = typeof pathname === 'string' && /^\/guides\/[^/]+\.pdf$/i.test(pathname);
  for (const [key, value] of getSecurityHeaderEntries()) {
    if (isGuidePdf && key === 'X-Frame-Options') {
      response.headers.set(key, 'SAMEORIGIN');
      continue;
    }
    if (isGuidePdf && key === 'Content-Security-Policy') {
      response.headers.set(key, buildGuidePdfContentSecurityPolicy());
      continue;
    }
    response.headers.set(key, value);
  }
  return response;
}
