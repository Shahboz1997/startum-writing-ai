import { unstable_cache } from 'next/cache';
import { getPrisma } from '@/lib/prisma';
import { buildWritingProfile } from '@/lib/writingProfileAnalytics';

export function writingProfileTag(userId) {
  return `writing-profile-${userId}`;
}

/**
 * Cached aggregate for /study-plan (invalidated when new checks are saved).
 */
export async function getCachedWritingProfile(userId, locale) {
  const loc = locale === 'ru' ? 'ru' : 'en';
  return unstable_cache(
    async () => {
      const prisma = getPrisma();
      const checks = await prisma.check.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return buildWritingProfile(checks, { locale: loc });
    },
    ['writing-profile-v2', userId, loc],
    { tags: [writingProfileTag(userId)], revalidate: 600 }
  )();
}
