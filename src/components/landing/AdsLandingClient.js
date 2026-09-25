'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import LandingLegalFooter from '@/components/landing/LandingLegalFooter';
import LandingPageCompact from '@/components/landing/LandingPageCompact';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

/**
 * Dedicated Ads LP: compact marketing + legal footer + auth modal.
 * Avoids loading the full WriterShell / heavy landing widgets.
 */
export default function AdsLandingClient() {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  const openLogin = (message) => {
    setAuthMessage(typeof message === 'string' && message.trim() ? message.trim() : null);
    setAuthOpen(true);
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#F9FAFB] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans antialiased">
      <LandingPageCompact
        onLoginClick={openLogin}
        onFullAnalysisClick={() =>
          openLogin(
            'Your preliminary band is ready. Sign in with Google to unlock the full error breakdown.'
          )
        }
        isLoggedIn={isLoggedIn}
      />
      <LandingLegalFooter />
      {authOpen ? (
        <AuthModal
          isOpen={authOpen}
          onClose={() => {
            setAuthOpen(false);
            setAuthMessage(null);
          }}
          onLoginSuccess={() => {
            setAuthOpen(false);
            setAuthMessage(null);
            if (typeof window !== 'undefined') window.location.href = '/?app=1';
          }}
          message={authMessage}
        />
      ) : null}
    </div>
  );
}
