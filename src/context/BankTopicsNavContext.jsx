'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'stratum_bank_topics_nav';

const defaultState = {
  taskType: '',
  subtype: '',
  dateFrom: '',
  dateTo: '',
  search: '',
  appliedSearch: '',
  page: 1,
  /** 'date-desc' | 'date-asc' — client-side sort of fetched list */
  sortBy: 'date-desc',
  selectedTopicId: null,
};

function readStored() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return o;
  } catch {
    return null;
  }
}

function writeStored(partial) {
  if (typeof window === 'undefined') return;
  try {
    const prev = readStored() || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState, ...prev, ...partial }));
  } catch {
    /* ignore quota */
  }
}

const BankTopicsNavContext = createContext(null);

/**
 * Shared Writing Bank ↔ Topics detail: filters, pagination, highlighted topic id.
 * Persisted to localStorage so /topics/:id and Bank stay in sync after navigation.
 */
export function BankTopicsNavProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setState({ ...defaultState, ...stored });
    }
    setHydrated(true);
  }, []);

  const patch = useCallback((updates) => {
    setState((s) => {
      const next = { ...s, ...updates };
      writeStored(next);
      return next;
    });
  }, []);

  const saveBeforeTopicNavigate = useCallback(
    (topicId, snapshot) => {
      patch({
        ...snapshot,
        selectedTopicId: Number(topicId),
      });
    },
    [patch]
  );

  const clearSelectedTopic = useCallback(() => {
    patch({ selectedTopicId: null });
  }, [patch]);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      setFilters: patch,
      saveBeforeTopicNavigate,
      clearSelectedTopic,
    }),
    [state, hydrated, patch, saveBeforeTopicNavigate, clearSelectedTopic]
  );

  return (
    <BankTopicsNavContext.Provider value={value}>{children}</BankTopicsNavContext.Provider>
  );
}

export function useBankTopicsNav() {
  const ctx = useContext(BankTopicsNavContext);
  if (!ctx) {
    throw new Error('useBankTopicsNav must be used within BankTopicsNavProvider');
  }
  return ctx;
}
