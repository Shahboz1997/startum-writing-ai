'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Search, AlertCircle, Star } from 'lucide-react';
import { useBank } from '@/context/BankContext';
import TemplateDetail from './TemplateDetail';
import styles from './TemplatesBank.module.css';

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

export default function TemplatesBank({ darkMode }) {
  const { toggleFavorite, isFavorite } = useBank();
  const [type, setType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const subtypeOptions = useMemo(() => {
    if (type === 'task1') return T1_SUB;
    if (type === 'task2') return T2_SUB;
    return [{ value: '', label: 'Any subtype' }, ...T1_SUB.slice(1), ...T2_SUB.slice(1)];
  }, [type]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (subtype) params.set('subtype', subtype);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (appliedSearch.trim()) params.set('q', appliedSearch.trim());
      const { data } = await axios.get(bankUrl(`/api/templates?${params.toString()}`));
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load templates');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, subtype, dateFrom, dateTo, appliedSearch]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    setPage(1);
  }, [type, subtype, dateFrom, dateTo, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onTypeChange = (v) => {
    setType(v);
    setSubtype('');
  };

  const fieldClass = darkMode
    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
        Browse writing frames by task and subtype. Tap a card for full structure and phrases. Star
        templates to save them in this browser ({' '}
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">local only</span>).
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
            onChange={(e) => setSubtype(e.target.value)}
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
            onChange={(e) => setDateFrom(e.target.value)}
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
            onChange={(e) => setDateTo(e.target.value)}
            className={`${styles.input} ${fieldClass}`}
          />
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
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
                placeholder="Search title, example, or structure…"
                className={`${styles.input} pl-10 ${fieldClass}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setAppliedSearch(search)}
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
            Showing {slice.length} of {items.length} templates (page {safePage} / {totalPages})
          </p>
          <div className={styles.grid}>
            {slice.map((t) => (
              <div key={t.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className={`${styles.card} w-full ${
                    darkMode
                      ? 'border-slate-800 bg-slate-900/40'
                      : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                    {t.type} · {t.subtype}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug pr-10">
                    {t.title}
                  </h3>
                  {t.date && (
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-500 mt-2">
                      {t.date}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(t.id);
                  }}
                  className={`${styles.starBtn} ${isFavorite(t.id) ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}
                  title={isFavorite(t.id) ? 'Remove from favourites' : 'Save to favourites'}
                  aria-pressed={isFavorite(t.id)}
                >
                  <Star className="w-5 h-5" fill={isFavorite(t.id) ? 'currentColor' : 'none'} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
          {items.length === 0 && !error && (
            <p className="text-center text-sm text-slate-500 py-8">No templates match your filters.</p>
          )}
          {totalPages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {selected && (
        <TemplateDetail template={selected} darkMode={darkMode} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
