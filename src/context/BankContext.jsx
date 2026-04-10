'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'ielts_bank_favorite_templates';

const BankContext = createContext(null);

/** Favourite template IDs persisted in localStorage */
export function BankProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed.map(Number).filter((n) => Number.isFinite(n)));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((ids) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFavorite = useCallback(
    (id) => {
      const n = Number(id);
      if (!Number.isFinite(n)) return;
      setFavoriteIds((prev) => {
        const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isFavorite = useCallback(
    (id) => favoriteIds.includes(Number(id)),
    [favoriteIds]
  );

  const value = useMemo(
    () => ({ favoriteIds, toggleFavorite, isFavorite }),
    [favoriteIds, toggleFavorite, isFavorite]
  );

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) {
    throw new Error('useBank must be used within BankProvider');
  }
  return ctx;
}
