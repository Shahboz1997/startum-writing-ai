'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { AnimatePresence } from 'framer-motion';
import AuthModal from '@/components/AuthModal';
import LandingLegalFooter from '@/components/landing/LandingLegalFooter';

export default function LandingMarketingShell({ isAuthenticated, children }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState(null);

  return (
    <div className="relative min-h-screen bg-white font-sans antialiased text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {isAuthenticated ? (
        <div className="mx-auto w-full max-w-4xl px-4 pt-6">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-50/70 px-4 py-3 text-amber-900 backdrop-blur dark:border-amber-400/20 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold">
                You are currently signed in. To register or sign in as a different user, please sign out first.
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/landing' })}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-0 min-h-screen">
        {typeof children === 'function'
          ? children({
              onLoginClick: (message) => {
                setAuthModalMessage(typeof message === 'string' ? message : null);
                setIsAuthOpen(true);
              },
              onFullAnalysisClick: () => {
                setAuthModalMessage('Sign up to see your Band Score');
                setIsAuthOpen(true);
              },
            })
          : children}
        <LandingLegalFooter />
      </div>

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
  );
}
