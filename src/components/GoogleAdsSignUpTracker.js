'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { trackGoogleAdsRegistrationConversion } from '@/lib/googleAdsConversions';

/**
 * Fires sign_up conversion once when NextAuth marks a brand-new OAuth user
 * (`session.pendingSignUpConversion`).
 */
export default function GoogleAdsSignUpTracker() {
  const { data: session, status, update } = useSession();
  const firedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!session?.pendingSignUpConversion) return;
    if (firedRef.current) return;
    firedRef.current = true;

    trackGoogleAdsRegistrationConversion({
      method: session.signUpMethod || 'google',
    });

    void update({ clearSignUpConversion: true }).catch(() => {});
  }, [status, session?.pendingSignUpConversion, session?.signUpMethod, update]);

  return null;
}
