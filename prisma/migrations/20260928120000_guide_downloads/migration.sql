-- Lead-magnet email capture for free PDF guides
CREATE TABLE IF NOT EXISTS "GuideDownload" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "guideSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GuideDownload_email_idx" ON "GuideDownload"("email");
CREATE INDEX IF NOT EXISTS "GuideDownload_guideSlug_createdAt_idx" ON "GuideDownload"("guideSlug", "createdAt" DESC);
