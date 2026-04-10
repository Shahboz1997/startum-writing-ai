'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useBankTopicsNav } from '@/context/BankTopicsNavContext';
import styles from '@/components/bank/TopicsBank.module.css';

const PAGE_SIZE = 8;

function bankUrl(path) {
  const base = process.env.NEXT_PUBLIC_BANK_API_URL || '';
  return `${base}${path}`;
}

/**
 * Paginated topic links under TopicDetails — same filters/sort as Bank (from context).
 */
export default function TopicsFilteredPager({ currentTopicId, darkMode }) {
  const nav = useBankTopicsNav();
  const [browsePage, setBrowsePage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { taskType: type, subtype, dateFrom, dateTo, appliedSearch, sortBy } = nav;

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (subtype) params.set('subtype', subtype);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (appliedSearch.trim()) params.set('q', appliedSearch.trim());
      const { data } = await axios.get(bankUrl(`/api/topics?${params.toString()}`));
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, subtype, dateFrom, dateTo, appliedSearch]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    setBrowsePage(1);
  }, [type, subtype, dateFrom, dateTo, appliedSearch, sortBy, currentTopicId]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      return sortBy === 'date-asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
    return copy;
  }, [items, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const safePage = Math.min(browsePage, totalPages);
  const slice = sortedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const fieldCard = darkMode
    ? 'border-slate-800 bg-slate-900/40 text-slate-100'
    : 'border-slate-200 bg-white shadow-sm text-slate-900';

  return (
    <section
      className={`rounded-3xl border p-6 md:p-8 space-y-4 animate-in fade-in duration-500 ${
        darkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/80'
      }`}
    >
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        More topics <span className="text-indigo-600 dark:text-indigo-400">(same filters)</span>
      </h2>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Page {safePage} / {totalPages} · filters match your Writing Bank selection
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {slice.map((t) => (
              <Link
                key={t.id}
                href={`/topics/${t.id}`}
                className={`block rounded-2xl border p-4 transition-all hover:shadow-md ${styles.card} ${
                  Number(t.id) === Number(currentTopicId) ? styles.cardActive : ''
                } ${fieldCard}`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-600 text-white">
                    {t.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 ml-auto">
                    {t.date}
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug line-clamp-3">{t.title}</p>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                className={`${styles.pagerBtn} ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-200 disabled:opacity-40'
                    : 'border-slate-200 bg-white text-slate-800 disabled:opacity-40'
                }`}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setBrowsePage((p) => Math.min(totalPages, p + 1))}
                className={`${styles.pagerBtn} ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-200 disabled:opacity-40'
                    : 'border-slate-200 bg-white text-slate-800 disabled:opacity-40'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
