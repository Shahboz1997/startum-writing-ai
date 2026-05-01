import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
// import { ensureAuthPublicUrl } from "@/lib/ensureAuthPublicUrl";

// ensureAuthPublicUrl();

// Force dynamic so env vars are read at request time (avoids stale/empty secret)
export const dynamic = "force-dynamic";
// Prisma + bcrypt require Node runtime (avoid Edge incompatibilities after deploy)
export const runtime = "nodejs";

// Required in production: AUTH_SECRET or NEXTAUTH_SECRET; optional GOOGLE_* for Google sign-in
const isDev = process.env.NODE_ENV === "development";

// Secret must be a non-empty string; undefined causes "Configuration" error
function getSecret() {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").trim();
  if (secret.length > 0) return secret;
  if (isDev) {
    const fallback = "dev-secret-min-32-chars-required-for-auth";
    console.warn("[auth] NEXTAUTH_SECRET / AUTH_SECRET missing; using dev fallback. Set in .env.local for production.");
    return fallback;
  }
  throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be set in production.");
}

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

export const authOptions = {
  trustHost: true,
  basePath: "/api/auth",
  secret: getSecret(),
  adapter: PrismaAdapter(getPrisma()),
  logger: {
    error(code, ...message) {
      console.error("[auth] error", code, ...message);
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
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // v5: must be "Linking" — "Merging" is ignored; otherwise OAuth + existing email → OAuthAccountNotLinked
            allowDangerousEmailAccountLinking: true,
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
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Если пользователя нет или он зашел через Google (нет пароля в базе)
        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

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
  },
  callbacks: {
    async signIn({ user, account }) {
      if (isDev) {
        console.log("[auth] signIn:", { email: user?.email, provider: account?.provider });
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
        if (user) {
          const uid = user.id ?? user.sub ?? token.sub;
          if (uid) {
            token.id = uid;
            // Keep JWT `sub` aligned with DB user id so session/callbacks stay consistent (OAuth profile `sub` is not our User.id).
            token.sub = String(uid);
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
        // `update()` from the client (e.g. after essay check decrements credits in DB) must reload JWT fields.
        // Without a DB read, token.credits stays stale because `session` is often empty when `update()` is called with no args.
        const creditUserId = token.id ?? token.sub;
        if (trigger === "update" && creditUserId) {
          try {
            const prisma = getPrisma();
            const row = await prisma.user.findUnique({
              where: { id: String(creditUserId) },
              select: { credits: true, language: true },
            });
            if (row) {
              token.credits = row.credits ?? 0;
              token.language = row.language ?? token.language ?? "en";
            }
          } catch (_) {
            /* ignore */
          }
        }
        if (trigger === "update") {
          if (session?.credits !== undefined) token.credits = session.credits;
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

/** Ошибка расшифровки JWT сессии (сменился секрет или битый cookie) — не отдаём 500, а завершаем сессию */
function isSessionDecryptionError(err) {
  let e = err;
  let depth = 0;
  while (e && depth < 6) {
    const name = e?.name || "";
    const msg = String(e?.message || "").toLowerCase();
    if (
      name === "JWTSessionError" ||
      name === "JWEDecryptionFailed" ||
      msg.includes("decryption secret") ||
      msg.includes("decryption failed") ||
      msg.includes("no matching")
    ) {
      return true;
    }
    e = e?.cause;
    depth += 1;
  }
  return false;
}

/** OAuth PKCE/state cookie lost or wrong host — очистить и начать вход заново */
function isPkceOrOAuthStateError(err) {
  let e = err;
  let depth = 0;
  while (e && depth < 6) {
    const name = e?.name || "";
    const msg = String(e?.message || "").toLowerCase();
    if (
      name === "InvalidCheck" ||
      msg.includes("pkcecodeverifier") ||
      (msg.includes("pkce") && msg.includes("parsed"))
    ) {
      return true;
    }
    e = e?.cause;
    depth += 1;
  }
  return false;
}

/** Auth.js может разбивать JWT на несколько cookie (session-token.0, .1, …) */
function appendClearAuthCookies(response) {
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.pkce.code_verifier",
    "__Secure-authjs.pkce.code_verifier",
    "authjs.state",
    "__Secure-authjs.state",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
  ];
  for (const n of names) {
    response.cookies.set(n, "", { maxAge: 0, path: "/" });
  }
  for (let i = 0; i < 8; i++) {
    response.cookies.set(`authjs.session-token.${i}`, "", { maxAge: 0, path: "/" });
    response.cookies.set(`__Secure-authjs.session-token.${i}`, "", { maxAge: 0, path: "/" });
  }
  return response;
}

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

/**
 * Auth.js catches many failures and redirects to /api/auth/error?error=Configuration (no throw).
 * After OAuth callback, recover by clearing cookies so the user can retry (fixes PKCE / host mismatch).
 */
function shouldRecoverOAuthCallbackRedirect(request, response) {
  if (response.status < 300 || response.status >= 400) return false;
  if (!request.nextUrl.pathname.includes("/callback/")) return false;
  const loc = response.headers.get("Location");
  if (!loc) return false;
  try {
    const u = new URL(loc, request.url);
    return (
      u.pathname.includes("/api/auth/error") &&
      u.searchParams.get("error") === "Configuration"
    );
  } catch {
    return false;
  }
}

// App Router requires named GET and POST exports; delegate to NextAuth handlers
export async function GET(request) {
  try {
    const res = await handlers.GET(request);
    // Don't silently swallow Configuration errors on OAuth callbacks.
    // Let Auth.js redirect to our custom /auth/error page so the real cause is visible in production.
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
    if (isDev) console.error("[auth] GET error:", err?.message ?? err);
    return jsonError(err?.message ?? "Authentication error");
  }
}

export async function POST(request) {
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
    if (isDev) console.error("[auth] POST error:", err?.message ?? err);
    return jsonError(err?.message ?? "Authentication error");
  }
}

