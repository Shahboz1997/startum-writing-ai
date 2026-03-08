import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Force dynamic so env vars are read at request time (avoids stale/empty secret)
export const dynamic = "force-dynamic";

// Required in .env.local: NEXTAUTH_SECRET (or AUTH_SECRET), NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
const isDev = process.env.NODE_ENV === "development";

// Secret must be a non-empty string; undefined causes "Configuration" error
function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret && typeof secret === "string" && secret.length > 0) return secret;
  if (isDev) {
    const fallback = "dev-secret-min-32-chars-required-for-auth";
    console.warn("[auth] NEXTAUTH_SECRET / AUTH_SECRET missing; using dev fallback. Set in .env.local for production.");
    return fallback;
  }
  throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be set in production.");
}

export const authOptions = {
  trustHost: true,
  secret: getSecret(),
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountMerging: true,
    }),
    // 2. Вход через Email/Пароль
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
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
    // Связывание Google с существующим пользователем по email + логирование ошибок (в т.ч. продакшен)
    async signIn({ user, account, profile }) {
      try {
        if (isDev) {
          console.log("[auth] signIn:", { email: user?.email, provider: account?.provider });
        }
        if (account?.provider === "google" && user?.email) {
          const prisma = getPrisma();
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (existingUser) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: existingUser.id,
                type: account.type ?? "oauth",
                provider: "google",
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                expires_at: account.expires_at ?? null,
              },
              update: {},
            });
            if (isDev) console.log("[auth] Account linked for", user.email);
          }
        }
        return true;
      } catch (err) {
        console.error("[auth] signIn error:", err?.message ?? err);
        if (err?.code) console.error("[auth] signIn error code:", err.code);
        throw err;
      }
    },
    // Сохраняем ID и Кредиты пользователя в JWT токене
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.language = user.language;
        if (!token.language) {
          try {
            const prisma = getPrisma();
            const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { language: true } });
            token.language = dbUser?.language || 'en';
          } catch (_) {
            token.language = 'en';
          }
        }
      }
      if (trigger === "update") {
        if (session?.credits !== undefined) token.credits = session.credits;
        if (session?.language !== undefined) token.language = session.language;
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
    error: "/",
  },
  debug: isDev,
};

// App Router: equivalent to const handler = NextAuth(authOptions); export { handler as GET, handler as POST }
const nextAuth = NextAuth(authOptions);
export const { handlers, auth } = nextAuth;

/** Ошибка расшифровки JWT сессии (сменился секрет или битый cookie) — не отдаём 500, а завершаем сессию */
function isSessionDecryptionError(err) {
  if (!err) return false;
  const name = err?.name || "";
  const msg = (err?.message || "").toLowerCase();
  return (
    name === "JWTSessionError" ||
    name === "JWEDecryptionFailed" ||
    msg.includes("decryption secret") ||
    msg.includes("decryption failed") ||
    msg.includes("no matching")
  );
}

/** Очищает cookie сессии и перенаправляет на главную (вместо 500 при невалидном токене) */
function clearSessionAndRedirect(request) {
  const homeUrl = new URL("/", request.url);
  const response = NextResponse.redirect(homeUrl, 302);
  response.cookies.set("authjs.session-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("__Secure-authjs.session-token", "", { maxAge: 0, path: "/" });
  return response;
}

// App Router requires named GET and POST exports; delegate to NextAuth handlers
export async function GET(request) {
  try {
    return await handlers.GET(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      if (isDev) console.warn("[auth] Session decryption failed, clearing session:", err?.message);
      return clearSessionAndRedirect(request);
    }
    throw err;
  }
}

export async function POST(request) {
  try {
    return await handlers.POST(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      if (isDev) console.warn("[auth] Session decryption failed, clearing session:", err?.message);
      return clearSessionAndRedirect(request);
    }
    throw err;
  }
}

