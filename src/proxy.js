import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAdminEmail } from '@/lib/admin';
import { allAuthCookieNames, appendClearAuthCookies } from '@/lib/authSessionCookies';
import { applySecurityHeaders } from '@/lib/securityHeaders.mjs';
import {
  getAuthSecretMaterial,
  getTokenEmail,
  getTokenUserId,
  isAuxiliaryOpenAiCheckRequest,
  jsonAuthRequired,
  jsonForbidden,
  nextWithAuthHeaders,
} from '@/lib/aiAccessShared';

async function readJsonBody(request) {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

async function resolveSessionToken(request) {
  const secret = getAuthSecretMaterial();
  if (!secret) return null;
  return getToken({
    req: request,
    secret,
    secureCookie:
      process.env.NODE_ENV === 'production' &&
      process.env.E2E_INSECURE_AUTH_COOKIES !== '1',
  });
}

function isAuthenticated(token) {
  return Boolean(getTokenUserId(token));
}

function requestHasAuthSessionCookie(request) {
  for (const name of allAuthCookieNames()) {
    if (request.cookies.get(name)?.value) return true;
  }
  return false;
}

function finalize(response, staleSession, pathname = '') {
  const cleared = staleSession ? appendClearAuthCookies(response) : response;
  return applySecurityHeaders(cleared, pathname);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = await resolveSessionToken(request);
  const staleSession = !token && requestHasAuthSessionCookie(request);
  const authed = isAuthenticated(token);

  if (pathname.startsWith('/api/admin')) {
    if (!authed) {
      return finalize(
        jsonAuthRequired('Sign in to access admin API.'),
        staleSession,
        pathname
      );
    }
    if (!isAdminEmail(getTokenEmail(token))) {
      return finalize(jsonForbidden('Forbidden'), staleSession, pathname);
    }
    return finalize(nextWithAuthHeaders(request, token), staleSession, pathname);
  }

  if (pathname.startsWith('/api/tts')) {
    if (request.method !== 'POST') {
      return finalize(NextResponse.next(), staleSession, pathname);
    }
    if (!authed) {
      return finalize(
        jsonAuthRequired('Sign in to use AI features.'),
        staleSession,
        pathname
      );
    }
    return finalize(nextWithAuthHeaders(request, token), staleSession, pathname);
  }

  if (pathname.startsWith('/api/check')) {
    if (request.method === 'DELETE') {
      if (!authed) {
        return finalize(
          jsonAuthRequired('Sign in to manage your archive.'),
          staleSession,
          pathname
        );
      }
      return finalize(nextWithAuthHeaders(request, token), staleSession, pathname);
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      if (body && isAuxiliaryOpenAiCheckRequest(body)) {
        if (authed) {
          return finalize(nextWithAuthHeaders(request, token), staleSession, pathname);
        }
        return finalize(NextResponse.next(), staleSession, pathname);
      }
      if (authed) {
        return finalize(nextWithAuthHeaders(request, token), staleSession, pathname);
      }
      return finalize(NextResponse.next(), staleSession, pathname);
    }
  }

  return finalize(NextResponse.next(), staleSession, pathname);
}

export const config = {
  matcher: [
    // Skip static assets (incl. guide PDFs — framing headers handled in next.config)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)',
  ],
};

