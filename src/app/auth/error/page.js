import { Suspense } from "react";
import AuthErrorClient from "./AuthErrorClient";

export const dynamic = "force-dynamic";

function AuthErrorFallback() {
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
          Loading details…
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorClient />
    </Suspense>
  );
}

