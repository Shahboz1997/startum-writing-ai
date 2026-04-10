'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TopicDetails from '@/components/TopicDetails';
import TopicsFilteredPager from '@/components/TopicsFilteredPager';

/**
 * Client shell for /topics/:id — fade transition, theme, layout aligned with main app.
 */
export default function TopicPageClient({ topicId }) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const darkMode = mounted && resolvedTheme === 'dark';

  const setActiveTab = useCallback(
    (tab) => {
      try {
        sessionStorage.setItem('stratum_nav_tab', tab);
      } catch {
        /* ignore */
      }
      router.push(`/?tab=${encodeURIComponent(tab)}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300">
      <Navbar
        activeTab=""
        setActiveTab={setActiveTab}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onLoginClick={() => router.push('/')}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 stratum-topic-fade">
        <nav className="text-sm">
          <Link
            href="/"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4"
          >
            STRATUM
          </Link>
          <span className="text-slate-400 mx-2">/</span>
          <span className="text-slate-600 dark:text-slate-400">Topic #{topicId}</span>
        </nav>

        <TopicDetails topicId={topicId} darkMode={darkMode} />
        <TopicsFilteredPager currentTopicId={topicId} darkMode={darkMode} />
      </main>
    </div>
  );
}
