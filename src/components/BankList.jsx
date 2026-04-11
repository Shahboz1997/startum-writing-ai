'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle } from 'lucide-react';
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

const SUBTYPE_LABEL = {
  graph: 'Graph',
  table: 'Table',
  process: 'Process',
  letter: 'Letter',
  opinion: 'Opinion',
  discussion: 'Discussion',
  'problem-solution': 'Problem & solution',
};

function subtypeDisplay(subtype) {
  const key = String(subtype || '').toLowerCase();
  const label = SUBTYPE_LABEL[key];
  return label ? label.toUpperCase().replace(/\s*&\s*/g, ' & ') : String(subtype || '').toUpperCase();
}

function taskTypeLabel(type) {
  if (type === 'task1') return 'Task 1';
  if (type === 'task2') return 'Task 2';
  return String(type || '');
}

function topicPromptText(t) {
  if (typeof t.promptText === 'string' && t.promptText.trim()) return t.promptText.trim();
  return String(t.title || '');
}

function isAbortError(e) {
  return (
    e?.code === 'ERR_CANCELED' ||
    e?.name === 'CanceledError' ||
    (typeof axios.isCancel === 'function' && axios.isCancel(e))
  );
}

function topicCardAriaLabel(t) {
  const prompt = topicPromptText(t);
  const short = prompt.length > 160 ? `${prompt.slice(0, 157).trim()}…` : prompt;
  const date = t.date || 'unknown date';
  return `${taskTypeLabel(t.type)}, ${subtypeDisplay(t.subtype)}, exam date ${date}. ${short}`;
}

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
  const fetchGenRef = useRef(0);
  const abortRef = useRef(null);

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
    abortRef.current?.abort();
    const gen = ++fetchGenRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (subtype) params.set('subtype', subtype);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (appliedSearch.trim()) params.set('q', appliedSearch.trim());
      const { data } = await axios.get(bankUrl(`/api/topics?${params.toString()}`), {
        signal: controller.signal,
      });
      if (gen !== fetchGenRef.current) return;
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      if (isAbortError(e)) return;
      if (gen !== fetchGenRef.current) return;
      setError(e.response?.data?.error || e.message || 'Failed to load topics');
      setItems([]);
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [type, subtype, dateFrom, dateTo, appliedSearch]);

  useEffect(() => {
    fetchTopics();
    return () => {
      abortRef.current?.abort();
    };
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
  const slice = useMemo(
    () => sortedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedItems, safePage]
  );

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
          className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            darkMode ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1 min-w-[12rem]">{error}</span>
          <button
            type="button"
            onClick={() => fetchTopics()}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              darkMode
                ? 'bg-red-900/60 text-red-100 hover:bg-red-900'
                : 'bg-white border border-red-200 text-red-900 hover:bg-red-100/80'
            }`}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <ul
          className={styles.grid}
          role="list"
          aria-busy="true"
          aria-label="Loading writing bank topics"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div
                className={`${styles.skeletonCard} ${darkMode ? 'border-slate-700 bg-slate-900/40' : ''}`}
                aria-hidden
              >
                <div className={styles.skeletonRow}>
                  <div className="flex gap-2 items-center">
                    <div
                      className={`${styles.skeletonBar} h-5 w-14 ${darkMode ? styles.skeletonBarDark : ''}`}
                    />
                    <div
                      className={`${styles.skeletonBar} h-3 w-20 ${darkMode ? styles.skeletonBarDark : ''}`}
                    />
                  </div>
                  <div
                    className={`${styles.skeletonBar} h-3 w-24 ${darkMode ? styles.skeletonBarDark : ''}`}
                  />
                </div>
                <div className={styles.skeletonLines}>
                  <div
                    className={`${styles.skeletonBar} h-3 w-full ${darkMode ? styles.skeletonBarDark : ''}`}
                  />
                  <div
                    className={`${styles.skeletonBar} h-3 w-[92%] ${darkMode ? styles.skeletonBarDark : ''}`}
                  />
                  <div
                    className={`${styles.skeletonBar} h-3 w-[70%] ${darkMode ? styles.skeletonBarDark : ''}`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {slice.length} of {sortedItems.length} topics (page {safePage} / {totalPages})
          </p>
          <ul className={styles.grid} role="list" aria-label="Writing bank topics">
            {slice.map((t) => {
              const isT1 = t.type === 'task1';
              const isSelected = Number(selectedTopicId) === Number(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onCardClick(t)}
                    aria-label={topicCardAriaLabel(t)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`text-left w-full ${styles.card} ${
                      darkMode ? `${styles.cardDark} bg-slate-900/50` : 'bg-white'
                    } ${isSelected ? (darkMode ? styles.cardActiveDark : styles.cardActive) : ''}`}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardMeta}>
                        <span
                          className={`${isT1 ? styles.badgeT1 : styles.badgeT2} ${
                            darkMode ? (isT1 ? styles.badgeT1Dark : styles.badgeT2Dark) : ''
                          }`}
                          aria-hidden
                        >
                          {taskTypeLabel(t.type)}
                        </span>
                        <span className={styles.cardSubtype} aria-hidden>
                          {subtypeDisplay(t.subtype)}
                        </span>
                      </div>
                      <span className={styles.cardDate} aria-hidden>
                        {t.date}
                      </span>
                    </div>
                    <p className={`${styles.cardPrompt} ${styles.cardPromptClamp}`}>{topicPromptText(t)}</p>
                  </button>
                </li>
              );
            })}
          </ul>
          {sortedItems.length === 0 && !error && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
              {appliedSearch.trim()
                ? `No topics match your search “${appliedSearch.trim()}”. Try different keywords or clear filters.`
                : 'No topics match your filters. Try widening the date range or choosing “All tasks”.'}
            </p>
          )}
          {totalPages > 1 && (
            <nav className={styles.pager} aria-label="Pagination">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => nav.setFilters({ page: Math.max(1, safePage - 1) })}
                aria-label="Previous page"
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
                  aria-label={`Page ${p}`}
                  aria-current={p === safePage ? 'page' : undefined}
                  className={`${styles.pagerBtn} ${
                    p === safePage
                      ? styles.pagerBtnActive
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
                aria-label="Next page"
                className={`${styles.pagerBtn} ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-200 disabled:opacity-40'
                    : 'border-slate-200 bg-white text-slate-800 disabled:opacity-40'
                }`}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
