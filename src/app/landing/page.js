"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import GlowFollow from "@/components/GlowFollow";

export default function LandingRoutePage() {
  const { status } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState(null);

  // If a user is already signed in (e.g. the share-link owner on the same browser),
  // keep them on landing and let them sign out to register/login as someone else.
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    // Optional: auto-open auth modal for unauthenticated visitors.
    // Keep it subtle: only open if user navigated here deliberately.
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      <GlowFollow />

      {isAuthenticated ? (
        <div className="mx-auto w-full max-w-4xl px-4 pt-6">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-50/70 px-4 py-3 text-amber-900 backdrop-blur dark:border-amber-400/20 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold">
                You are currently signed in. To register or sign in as a different user, please sign out first.
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/landing" })}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-0 min-h-screen">
        <LandingPage
          onLoginClick={() => {
            setAuthModalMessage(null);
            setIsAuthOpen(true);
          }}
          onFullAnalysisClick={() => {
            setAuthModalMessage("Sign up to see your Band Score");
            setIsAuthOpen(true);
          }}
          isLoggedIn={isAuthenticated}
        />

        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => {
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              onLoginSuccess={() => {
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              message={authModalMessage}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

