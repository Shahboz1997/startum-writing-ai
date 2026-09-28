import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getGuideBySlug, guidePdfPath } from '@/lib/guides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST { email, guideSlug }
 * Saves lead email (when DB + GuideDownload table exist) and returns the public PDF path.
 * Download still succeeds if save fails — client always gets downloadUrl when email is valid.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body?.email;
    const guideSlug = typeof body?.guideSlug === 'string' ? body.guideSlug.trim() : '';

    const guide = getGuideBySlug(guideSlug);
    if (!guide) {
      return NextResponse.json({ error: 'Unknown guide.' }, { status: 404 });
    }

    const email = String(rawEmail ?? '')
      .trim()
      .toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    let saved = false;
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (dbUrl) {
      try {
        const prisma = getPrisma();
        const id = randomUUID();
        // Raw SQL so this works before `prisma generate` picks up the new model.
        await prisma.$executeRaw`
          INSERT INTO "GuideDownload" (id, email, "guideSlug", "createdAt")
          VALUES (${id}, ${email}, ${guide.slug}, CURRENT_TIMESTAMP)
        `;
        saved = true;
      } catch (err) {
        // TODO: run `npx prisma migrate deploy` for 20260928120000_guide_downloads
        console.error('GUIDE_DOWNLOAD_SAVE_FAILED:', err?.message || err);
      }
    }

    return NextResponse.json({
      ok: true,
      saved,
      downloadUrl: guidePdfPath(guide),
      fileName: guide.fileName,
      title: guide.title,
    });
  } catch (err) {
    console.error('GUIDE_DOWNLOAD_ERROR:', err?.message || err);
    return NextResponse.json({ error: 'Could not process download request.' }, { status: 500 });
  }
}
