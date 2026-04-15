"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function humanizeAuthError(code) {
  const c = String(code || "").trim();
  if (!c) return "Unknown auth error";
  // Auth.js common codes
  if (c === "Configuration") {
    return "Auth configuration error. This usually means missing/incorrect environment variables (AUTH_URL/NEXTAUTH_URL, AUTH_SECRET/NEXTAUTH_SECRET, Google credentials) or a host/redirect mismatch.";
  }
  if (c === "OAuthSignin" || c === "OAuthCallback") {
    return "OAuth sign-in failed. Check Google OAuth redirect URI and AUTH_URL/NEXTAUTH_URL.";
  }
  if (c === "OAuthAccountNotLinked") {
    return "This email is already registered with a different sign-in method. Use the same method you used originally.";
  }
  if (c === "AccessDenied") {
    return "Access denied by the provider or your app.";
  }
  if (c === "Verification") {
    return "Verification failed or expired.";
  }
  return `Auth error: ${c}`;
}

export default function AuthErrorPage() {
  const sp = useSearchParams();
  const error = sp?.get("error") || "";
  const callbackUrl = sp?.get("callbackUrl") || "";

  const message = useMemo(() => humanizeAuthError(error), [error]);

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          STRATUM · Authentication
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {message}
        </p>

        {callbackUrl ? (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              callbackUrl
            </div>
            <div className="mt-1 break-all text-xs text-slate-700 dark:text-slate-200">
              {callbackUrl}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
          >
            Try again
          </Link>
        </div>

        <div className="mt-6 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          If this happens only after deploy, check Production env vars on your host and Google OAuth redirect URI:
          <span className="font-semibold"> https://YOUR_DOMAIN/api/auth/callback/google</span>
        </div>
      </div>
    </div>
  );
}

