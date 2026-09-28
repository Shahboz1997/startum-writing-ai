'use client';

import { BookOpen, Download, FileText } from 'lucide-react';
import { GUIDES } from '@/lib/guides';
import {
  LandingCard,
  LandingIconCard,
  LandingInfoPanel,
  LandingSection,
  LandingSectionHeader,
} from '@/components/landing/landingUi';

const FEATURED_GUIDES = GUIDES.slice(0, 4);

/**
 * Marketing teaser for free IELTS Writing PDF guides (lead magnets).
 */
export default function LandingGuidesSection() {
  return (
    <LandingSection id="free-guides" ariaLabelledby="section-free-guides">
      <LandingSectionHeader
        tagline="Free resources"
        id="section-free-guides"
        title="IELTS Writing PDF guides"
        description="Original Stratum packs for Task 1 and Task 2 — structure, vocabulary, common mistakes, and idea banks. Read on site or download a copy."
      />

      <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <LandingIconCard
          icon={FileText}
          title="Structure & charts"
          description="Task 2 paragraph maps and Academic Task 1 frameworks for graphs, tables, and processes."
        />
        <LandingIconCard
          icon={BookOpen}
          title="Band 7 upgrades"
          description="Vocabulary packs, stuck-at-6.5 fixes, and the mistakes examiners penalise most often."
        />
        <LandingIconCard
          icon={Download}
          title="Read or download"
          description="Open any pack in the browser, then grab a PDF when you want an offline copy."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
        {FEATURED_GUIDES.map((guide) => (
          <LandingCard key={guide.slug} className="h-full !p-4 sm:!p-5">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {guide.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {topic}
                </span>
              ))}
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {guide.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
              {guide.description}
            </p>
          </LandingCard>
        ))}
      </div>

      <LandingInfoPanel accent="indigo">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {GUIDES.length} free packs — no credit card
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Browse the full library on the guides page, then paste your draft into the Writing lab for
            examiner-style feedback.
          </p>
        </div>
      </LandingInfoPanel>
    </LandingSection>
  );
}
