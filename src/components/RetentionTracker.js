'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackReturnDay2 } from '@/lib/analyticsEvents';
import {
  getReturnDay2Payload,
  markActivatedAt,
  markReturnDay2Sent,
} from '@/lib/retentionEvents';

/**
 * Marks first authenticated visit as activation start; fires return_day_2 once
 * when the user comes back on a later calendar day.
 */
export default function RetentionTracker() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    markActivatedAt();
    const { shouldTrack, daysSinceActivation } = getReturnDay2Payload();
    if (!shouldTrack) return;
    markReturnDay2Sent();
    trackReturnDay2({ daysSinceActivation });
  }, [status]);

  return null;
}
