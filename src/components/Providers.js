"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { WordListProvider } from "@/context/WordListContext";
import UserLibrarySync from "@/components/UserLibrarySync";
import AddToHomeScreenBanner from "@/components/AddToHomeScreenBanner";
import GoogleAdsSignUpTracker from "@/components/GoogleAdsSignUpTracker";
import RetentionTracker from "@/components/RetentionTracker";

const isDev = process.env.NODE_ENV === "development";

/** Avoid parallel warm-db calls when session re-renders (reduces Supabase pool churn). */
let warmDbLastAt = 0;
const WARM_DB_COOLDOWN_MS = 45_000;

function AuthDbWarm() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const now = Date.now();
    if (now - warmDbLastAt < WARM_DB_COOLDOWN_MS) return;
    warmDbLastAt = now;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    void fetch("/api/auth/warm-db", { cache: "no-store", signal: controller.signal })
      .catch(() => {})
      .finally(() => clearTimeout(timer));

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [status, session?.user?.id]);

  return null;
}

/**
 * Session from the server layout avoids an immediate client fetch to /api/auth/session
 * while Turbopack is still compiling the auth route (common cause of ClientFetchError).
 */
export function Providers({ children, session }) {
  return (
    <SessionProvider
      session={session ?? null}
      basePath="/api/auth"
      refetchInterval={isDev ? 0 : 5 * 60}
      refetchOnWindowFocus={!isDev}
    >
      <AuthDbWarm />
      <GoogleAdsSignUpTracker />
      <RetentionTracker />
      <UserLibrarySync />
      <Toaster position="top-center" />
      <WordListProvider>
        {children}
        <AddToHomeScreenBanner />
      </WordListProvider>
    </SessionProvider>
  );
}
