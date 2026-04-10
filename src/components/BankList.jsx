'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBankTopicsNav } from '@/context/BankTopicsNavContext';
import styles from '@/components/bank/TopicsBank.module.css';

const PAGE_SIZE = 10;

function bankUrl(path) {
  const base = process.env.NEXT_PUBLIC_BANK_API_URL || '';
  return `${base}${path}`;
}

const T1_SUB = [
  { value: '', label: 'All Task 1 types' },
  { value: 'graph', label: 'Graph / chart / map' },
  { value: 'table', label: 'Table' },
  { value: 'process', label: 'Process' },
  { value: 'letter', label: 'Letter' },
];
const T2_SUB = [
  { value: '', label: 'All Task 2 types' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'problem-solution', label: 'Problem & solution' },
];

/**
 * Writing Bank — exam topics grid. Clicks go to /topics/:id; filters sync via BankTopicsNavContext + localStorage.
 */
export default function BankList({ darkMode }) {
  const router = useRouter();
  const nav = useBankTopicsNav();
  const { setFilters, hydrated: navHydrated } = nav;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const type = nav.taskType;
  const subtype = nav.subtype;
  const dateFrom = nav.dateFrom;
  const dateTo = nav.dateTo;
  const search = nav.search;
  const appliedSearch = nav.appliedSearch;
  const page = nav.page;
  const sortBy = nav.sortBy;
  const selectedTopicId = nav.selectedTopicId;

  const subtypeOptions = useMemo(() => {
    if (type === 'task1') return T1_SUB;
    if (type === 'task2') return T2_SUB;
    return [{ value: '', label: 'Any subtype' }, ...T1_SUB.slice(1), ...T2_SUB.slice(1)];
  }, [type]);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (subtype) params.set('subtype', subtype);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (appliedSearch.trim()) params.set('q', appliedSearch.trim());
      const { data } = await axios.get(bankUrl(`/api/topics?${params.toString()}`));
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load topics');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, subtype, dateFrom, dateTo, appliedSearch]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

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
  const safePage = Math.min(page, totalPages);
  const slice = sortedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (loading || !navHydrated) return;
    if (page > totalPages) {
      setFilters({ page: totalPages });
    }
  }, [loading, navHydrated, page, totalPages, setFilters]);

  const onTypeChange = (v) => {
    nav.setFilters({ taskType: v, subtype: '', page: 1 });
  };

  const onCardClick = (t) => {
    nav.saveBeforeTopicNavigate(t.id, {
      taskType: type,
      subtype,
      dateFrom,
      dateTo,
      search,
      appliedSearch,
      page: safePage,
      sortBy,
    });
    router.push(`/topics/${t.id}`);
  };

  const fieldClass = darkMode
    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
        Filter by paper type, subtype, and exam date. Use search to match keywords in the prompt text.
        Dates use format <span className="font-mono text-xs">YYYY-MM-DD</span>.
      </p>

      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Task type
          </label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className={`${styles.select} ${fieldClass}`}
          >
            <option value="">All tasks</option>
            <option value="task1">Task 1</option>
            <option value="task2">Task 2</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subtype
          </label>
          <select
            value={subtype}
            onChange={(e) => nav.setFilters({ subtype: e.target.value, page: 1 })}
            className={`${styles.select} ${fieldClass}`}
          >
            {subtypeOptions.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Date from
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => nav.setFilters({ dateFrom: e.target.value, page: 1 })}
            className={`${styles.input} ${fieldClass}`}
          />
        </div>
        <div className={styles.filterField}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Date to
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => nav.setFilters({ dateTo: e.target.value, page: 1 })}
            className={`${styles.input} ${fieldClass}`}
          />
        </div>
        <div className={styles.filterField}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sort by date
          </label>
          <select
            value={sortBy}
            onChange={(e) => nav.setFilters({ sortBy: e.target.value, page: 1 })}
            className={`${styles.select} ${fieldClass}`}
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
          </select>
        </div>
        <div className={`${styles.filterField} md:col-span-2`}>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Keyword search
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => nav.setFilters({ search: e.target.value })}
                onKeyDown={(e) =>
                  e.key === 'Enter' && nav.setFilters({ appliedSearch: search, page: 1 })
                }
                placeholder="e.g. traffic, energy, opinion…"
                className={`${styles.input} pl-10 ${fieldClass}`}
              />
            </div>
            <button
              type="button"
              onClick={() => nav.setFilters({ appliedSearch: search, page: 1 })}
              className="btn-stratum px-4 py-2 rounded-xl shrink-0"
            >
              <span className="btn-stratum-text text-[10px]">Search</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            darkMode ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {slice.length} of {sortedItems.length} topics (page {safePage} / {totalPages})
          </p>
          <div className={styles.grid}>
            {slice.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onCardClick(t)}
                className={`text-left w-full ${styles.card} ${
                  Number(selectedTopicId) === Number(t.id) ? styles.cardActive : ''
                } ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900/40'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-600 text-white">
                    {t.type}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    {t.subtype}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 ml-auto">
                    {t.date}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {t.title}
                </h3>
              </button>
            ))}
          </div>
          {sortedItems.length === 0 && !error && (
            <p className="text-center text-sm text-slate-500 py-8">No topics match your filters.</p>
          )}
          {totalPages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => nav.setFilters({ page: Math.max(1, safePage - 1) })}
                className={`${styles.pagerBtn} ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-200 disabled:opacity-40'
                    : 'border-slate-200 bg-white text-slate-800 disabled:opacity-40'
                }`}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => nav.setFilters({ page: p })}
                  className={`${styles.pagerBtn} ${
                    p === safePage
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : darkMode
                        ? 'border-slate-700 bg-slate-900 text-slate-300'
                        : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => nav.setFilters({ page: Math.min(totalPages, safePage + 1) })}
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
    </div>
  );
}
