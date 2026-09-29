import util from "node:util";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getPrisma, withPrismaRetry } from "@/lib/prisma";
import { createLazyPrismaAdapter } from "@/lib/lazyPrismaAdapter";
import bcrypt from "bcryptjs";
import { ensureAuthPublicUrlForRequest } from "@/lib/ensureAuthPublicUrl";
import { formatAuthErrorCause } from "@/lib/formatAuthErrorCause";
import {
  appendClearAuthCookies,
  isPkceOrOAuthStateError,
  isSessionDecryptionError,
} from "@/lib/authSessionCookies";
import { getAuthSecret } from "@/lib/authSecret";

// Force dynamic so env vars are read at request time (avoids stale/empty secret)
export const dynamic = "force-dynamic";
// Prisma + bcrypt require Node runtime (avoid Edge incompatibilities after deploy)
export const runtime = "nodejs";

// Required in production: AUTH_SECRET or NEXTAUTH_SECRET; optional GOOGLE_* for Google sign-in
const isDev = process.env.NODE_ENV === "development";

const googleClientId = (
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  ""
).trim();
const googleClientSecret = (
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  ""
).trim();

const useSecureCookies =
  process.env.NODE_ENV === "production" &&
  process.env.E2E_INSECURE_AUTH_COOKIES !== "1";

export const authOptions = {
  trustHost: true,
  basePath: "/api/auth",
  secret: getAuthSecret(),
  useSecureCookies,
  adapter: createLazyPrismaAdapter(),
  logger: {
    error(code, ...message) {
      const candidates = [code, ...message];
      if (candidates.some((c) => isSessionDecryptionError(c))) {
        if (isDev) {
          console.warn("[auth] Stale session cookie ignored (decryption secret mismatch).");
        }
        return;
      }
      const extra = message
        .map((m) => {
          if (m instanceof Error) return formatAuthErrorCause(m);
          if (m != null && typeof m === "object") {
            try {
              return formatAuthErrorCause(m);
            } catch {
              return String(m);
            }
          }
          return String(m);
        })
        .filter(Boolean)
        .join(" | ");
      console.error("[auth] error", code, extra || message.join(" "));
    },
    warn(code, ...message) {
      console.warn("[auth] warn", code, ...message);
    },
    debug(code, ...message) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log("[auth] debug", code, ...message);
      }
    },
  },
  // Silence optional experiments/features (reduces noisy warnings).
  experimental: {
    webAuthn: false,
  },
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          // The name Google shows on the consent screen (e.g. "STRATUM.ai")
          // is NOT set here — edit Google Cloud Console → APIs & Services → OAuth consent screen → App name.
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
            httpOptions: { timeout: 20_000 },
            authorization: {
              params: {
                scope: "openid email profile",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    // 2. Вход через Email/Пароль
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginToken: { label: "Login token", type: "text" },
      },
      async authorize(credentials) {
        function looksLikeBcryptHash(value) {
          const v = String(value ?? "");
          // bcrypt prefixes: $2a$, $2b$, $2y$
          return /^\$2[aby]\$\d{2}\$/.test(v);
        }

        const loginToken = String(credentials?.loginToken ?? "").trim();
        if (loginToken) {
          const { consumeOneTimeLoginToken } = await import(
            "@/lib/emailVerification"
          );
          const user = await withPrismaRetry(() =>
            consumeOneTimeLoginToken(loginToken)
          );
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits,
            language: user.language || "en",
          };
        }

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await withPrismaRetry(() =>
          getPrisma().user.findUnique({
            where: { email },
          })
        );

        // Если пользователя нет или он зашел через Google (нет пароля в базе)
        if (!user || !user.password) return null;

        const stored = String(user.password ?? "");
        let isPasswordValid = false;

        if (looksLikeBcryptHash(stored)) {
          isPasswordValid = await bcrypt.compare(String(password), stored);
        } else {
          // Backward compatibility: old accounts may have plain text passwords.
          isPasswordValid = String(password) === stored;
          // If the plain password matched, upgrade to bcrypt hash.
          if (isPasswordValid) {
            try {
              const hashed = await bcrypt.hash(String(password), 10);
              await withPrismaRetry(() =>
                getPrisma().user.update({
                  where: { id: user.id },
                  data: { password: hashed },
                })
              );
            } catch {
              // best-effort: do not block login if upgrade fails
            }
          }
        }

        if (!isPasswordValid) return null;

        if (!user.emailVerified) {
          const mailConfigured = Boolean(
            (process.env.RESEND_API_KEY || "").trim() ||
              ((process.env.EMAIL_USER || "").trim() &&
                (process.env.EMAIL_PASS || "").trim())
          );
          if (!mailConfigured) {
            try {
              await withPrismaRetry(() =>
                getPrisma().user.update({
                  where: { id: user.id },
                  data: { emailVerified: new Date() },
                })
              );
            } catch {
              return null;
            }
          } else {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          credits: user.credits,
          language: user.language || 'en',
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Обязательно для Credentials и Middleware
    // Students often draft for 40+ minutes; keep the session far beyond one writing block.
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (isDev) {
        console.log("[auth] signIn:", { email: user?.email, provider: account?.provider });
      }
      if (account?.provider === "google") {
        const userId = user?.id;
        const email = user?.email
          ? String(user.email).trim().toLowerCase()
          : "";
        try {
          if (userId) {
            await withPrismaRetry(() =>
              getPrisma().user.update({
                where: { id: String(userId) },
                data: { emailVerified: new Date() },
              })
            );
          } else if (email) {
            await withPrismaRetry(() =>
              getPrisma().user.updateMany({
                where: { email, emailVerified: null },
                data: { emailVerified: new Date() },
              })
            );
          }
        } catch {
          /* best-effort */
        }
      }
      return true;
    },
    /** Не уводить пользователя на чужой origin после OAuth */
    async redirect({ url, baseUrl }) {
      const base = baseUrl.replace(/\/+$/, "");
      if (url.startsWith("/")) return `${base}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === new URL(base).origin) return url;
      } catch {
        /* ignore */
      }
      return base;
    },
    // Сохраняем ID и Кредиты пользователя в JWT токене
    async jwt({ token, user, trigger, session, account }) {
      try {
        if (trigger === "update" && session?.clearSignUpConversion) {
          token.pendingSignUpConversion = false;
          delete token.signUpMethod;
        }
        if (user) {
          const uid = user.id ?? user.sub ?? token.sub;
          if (uid) {
            token.id = uid;
            // Keep JWT `sub` aligned with DB user id so session/callbacks stay consistent (OAuth profile `sub` is not our User.id).
            token.sub = String(uid);
          }
          // New OAuth users: fire Google Ads sign_up once on the client.
          if (account?.provider && account.provider !== "credentials" && uid) {
            try {
              const row = await getPrisma().user.findUnique({
                where: { id: String(uid) },
                select: { createdAt: true },
              });
              const createdMs = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
              if (createdMs && Date.now() - createdMs < 120_000) {
                token.pendingSignUpConversion = true;
                token.signUpMethod = account.provider;
              }
            } catch {
              /* best-effort */
            }
          }
          if (account?.provider === "google" && !token.id && user.email) {
            try {
              const prisma = getPrisma();
              const row = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true, credits: true, language: true },
              });
              if (row) {
                token.id = row.id;
                token.sub = String(row.id);
                token.credits = row.credits ?? 0;
                token.language = row.language ?? "en";
              }
            } catch {
              /* ignore */
            }
          }
          if (token.id) {
            try {
              const prisma = getPrisma();
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id },
                select: { credits: true, language: true },
              });
              token.credits = dbUser?.credits ?? user.credits ?? 0;
              token.language = dbUser?.language ?? user.language ?? "en";
            } catch (_) {
              token.credits = user.credits ?? 0;
              token.language = user.language ?? "en";
            }
          } else {
            token.credits = user.credits ?? 0;
            token.language = user.language ?? "en";
          }
        }
        // `update()` from the client reloads JWT fields from DB (credits after /api/check, etc.).
        // Do not accept client `session.credits` — it caused double-decrement in the UI vs DB.
        const creditUserId = token.id ?? token.sub;
        if (trigger === "update" && (creditUserId || token.email)) {
          try {
            const prisma = getPrisma();
            let row = creditUserId
              ? await prisma.user.findUnique({
                  where: { id: String(creditUserId) },
                  select: { id: true, credits: true, language: true },
                })
              : null;
            if (!row && token.email) {
              row = await prisma.user.findUnique({
                where: { email: String(token.email).trim().toLowerCase() },
                select: { id: true, credits: true, language: true },
              });
              if (row?.id) {
                token.id = row.id;
                token.sub = String(row.id);
              }
            }
            if (row) {
              token.credits = row.credits ?? 0;
              token.language = row.language ?? token.language ?? "en";
            }
          } catch (_) {
            /* ignore */
          }
        }
        if (trigger === "update") {
          // Credits always come from DB on `update` (see block above). Client must not overwrite JWT.
          if (session?.language !== undefined) token.language = session.language;
        }
      } catch (e) {
        if (isDev) console.error("[auth] jwt callback:", e?.message ?? e);
      }
      return token;
    },
    // Must return a session object; never return false or undefined (causes Configuration error)
    async session({ session, token }) {
      if (!session) return { user: {}, expires: "" };
      if (session.user) {
        session.user.id = token?.id ?? session.user.email;
        session.user.credits = token?.credits ?? 0;
        session.user.language = token?.language ?? "en";
      }
      session.pendingSignUpConversion = Boolean(token?.pendingSignUpConversion);
      session.signUpMethod = token?.signUpMethod || null;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
    // Не указывать error: "/" — иначе Auth.js редиректит с маской error=Configuration вместо реальной причины (см. assertConfig).
  },
  // Auth.js warning "debug-enabled" will only show when debug=true.
  // Default to false unless explicitly enabled.
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

// App Router: equivalent to const handler = NextAuth(authOptions); export { handler as GET, handler as POST }
const nextAuth = NextAuth(authOptions);
export const { handlers, auth } = nextAuth;

function isAuthSessionRoute(request) {
  const p = request.nextUrl.pathname;
  return p === "/api/auth/session" || p.endsWith("/auth/session");
}

/** Ответ для fetch() клиента next-auth: JSON, не редирект (редирект ломает SessionProvider и выглядит как «сразу вылетел»). */
function clearSessionJsonResponse() {
  const res = NextResponse.json(null, { status: 200 });
  return appendClearAuthCookies(res);
}

/** Очищает auth cookies и перенаправляет на главную (только для навигации браузера, не для /api/auth/session). */
function clearAuthCookiesAndRedirect(request) {
  const homeUrl = new URL("/", request.url);
  const response = NextResponse.redirect(homeUrl, 302);
  return appendClearAuthCookies(response);
}

// Return JSON on error so the client never receives HTML (fixes ClientFetchError "Unexpected token '<', '<!DOCTYPE'")
function jsonError(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function logHandlerError(routeLabel, err) {
  const chain = formatAuthErrorCause(err);
  console.error(`[auth] ${routeLabel}:`, chain || err?.message || String(err));
  if (isDev) {
    console.error(
      `[auth] ${routeLabel} (inspect):`,
      util.inspect(err, { depth: 15, colors: false, breakLength: 100 })
    );
  }
}

function chainOrAuthMessage(err) {
  const c = formatAuthErrorCause(err);
  return c && c.trim().length > 0 ? c : err?.message ?? "Authentication error";
}

function isConnectTimeoutError(err) {
  const chain = formatAuthErrorCause(err);
  return (
    /ConnectTimeoutError/i.test(chain) ||
    /UND_ERR_CONNECT_TIMEOUT/i.test(chain) ||
    /fetch failed/i.test(chain)
  );
}

function isDbTimeoutError(err) {
  const chain = formatAuthErrorCause(err);
  return (
    /P1001|P1008|P1017|P2024|timeout exceeded when trying to connect|Can't reach database server|Connection terminated|warm-db timeout/i.test(
      chain
    )
  );
}

/**
 * Auth.js often maps OAuth callback failures (network, adapter) to error=Configuration.
 * Rewrite to a clearer error page so users can retry instead of checking env vars.
 */
function rewriteMisleadingAuthErrorRedirect(request, response) {
  if (response.status < 300 || response.status >= 400) return response;
  const loc = response.headers.get("Location");
  if (!loc) return response;

  try {
    const u = new URL(loc, request.url);
    const err = u.searchParams.get("error");
    const isMisleadingConfig =
      err === "Configuration" &&
      (u.pathname.includes("/auth/error") || u.pathname.includes("/api/auth/error"));

    if (!isMisleadingConfig) return response;

    const target = new URL("/auth/error", request.url);
    target.searchParams.set("error", "OAuthCallback");
    if (request.nextUrl.pathname.includes("/callback/google")) {
      target.searchParams.set("reason", "oauth_config");
    }
    return NextResponse.redirect(target);
  } catch {
    return response;
  }
}

function oauthCallbackErrorRedirect(request, reason = "google_timeout") {
  const target = new URL("/auth/error", request.url);
  target.searchParams.set("error", "OAuthCallback");
  target.searchParams.set("reason", reason);
  return NextResponse.redirect(target);
}

// App Router requires named GET and POST exports; delegate to NextAuth handlers
export async function GET(request) {
  ensureAuthPublicUrlForRequest(request);
  const t0 = Date.now();
  const isOAuthCallback = request.nextUrl.pathname.includes("/callback/");
  try {
    const res = await handlers.GET(request);
    if (isOAuthCallback) {
      console.log(
        "[auth] OAuth callback timing:",
        request.nextUrl.pathname,
        `${Date.now() - t0}ms`,
        res.status
      );
      return rewriteMisleadingAuthErrorRedirect(request, res);
    }
    return res;
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      if (isDev) console.warn("[auth] Session decryption failed, clearing session:", err?.message);
      if (isAuthSessionRoute(request)) {
        return clearSessionJsonResponse();
      }
      return clearAuthCookiesAndRedirect(request);
    }
    if (isPkceOrOAuthStateError(err)) {
      if (isDev) console.warn("[auth] OAuth PKCE/state invalid, clearing auth cookies:", err?.message);
      if (isAuthSessionRoute(request)) {
        return clearSessionJsonResponse();
      }
      return clearAuthCookiesAndRedirect(request);
    }
    if (isOAuthCallback) {
      console.warn(
        "[auth] OAuth callback error after",
        `${Date.now() - t0}ms`,
        request.nextUrl.pathname
      );
      if (isConnectTimeoutError(err)) {
        return oauthCallbackErrorRedirect(request, "google_timeout");
      }
      if (isDbTimeoutError(err)) {
        return oauthCallbackErrorRedirect(request, "db_timeout");
      }
      return oauthCallbackErrorRedirect(request, "oauth_callback");
    }
    logHandlerError("GET unhandled", err);
    return jsonError(
      isDev ? chainOrAuthMessage(err) : "Authentication error"
    );
  }
}

export async function POST(request) {
  ensureAuthPublicUrlForRequest(request);
  try {
    return await handlers.POST(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      if (isDev) console.warn("[auth] Session decryption failed, clearing session:", err?.message);
      if (isAuthSessionRoute(request)) {
        return clearSessionJsonResponse();
      }
      return clearAuthCookiesAndRedirect(request);
    }
    if (isPkceOrOAuthStateError(err)) {
      if (isDev) console.warn("[auth] OAuth PKCE/state invalid, clearing auth cookies:", err?.message);
      if (isAuthSessionRoute(request)) {
        return clearSessionJsonResponse();
      }
      return clearAuthCookiesAndRedirect(request);
    }
    logHandlerError("POST unhandled", err);
    return jsonError(
      isDev ? chainOrAuthMessage(err) : "Authentication error"
    );
  }
}

