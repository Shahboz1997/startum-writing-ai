import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

function readAppQueryFlags() {
  if (typeof window === 'undefined') return { forceLanding: false, skipAppLanding: false };
  try {
    const sp = new URLSearchParams(window.location.search);
    return {
      forceLanding: sp.get('landing') === '1',
      skipAppLanding: sp.get('app') === '1',
    };
  } catch {
    return { forceLanding: false, skipAppLanding: false };
  }
}

function noop() {}

export function useWriterNavRestore({
  setActiveTab,
  setTask1Kind,
  setPromptT1Letter,
  setPromptT1Academic,
  setLetterMeta,
  setImage,
  setEssayT1,
  setEssayT2,
}) {
  const pathname = usePathname();
  const [forceLanding, setForceLanding] = useState(() => readAppQueryFlags().forceLanding);
  const skipAppLanding = useSyncExternalStore(
    () => () => {},
    () => readAppQueryFlags().skipAppLanding,
    () => false,
  );

  // Keep setters in refs so the restore effect deps stay a fixed size (avoids HMR / undefined setter churn).
  const settersRef = useRef({
    setActiveTab,
    setTask1Kind,
    setPromptT1Letter,
    setPromptT1Academic,
    setLetterMeta,
    setImage,
    setEssayT1,
    setEssayT2,
  });
  settersRef.current = {
    setActiveTab: typeof setActiveTab === 'function' ? setActiveTab : noop,
    setTask1Kind: typeof setTask1Kind === 'function' ? setTask1Kind : noop,
    setPromptT1Letter: typeof setPromptT1Letter === 'function' ? setPromptT1Letter : noop,
    setPromptT1Academic: typeof setPromptT1Academic === 'function' ? setPromptT1Academic : noop,
    setLetterMeta: typeof setLetterMeta === 'function' ? setLetterMeta : noop,
    setImage: typeof setImage === 'function' ? setImage : noop,
    setEssayT1: typeof setEssayT1 === 'function' ? setEssayT1 : noop,
    setEssayT2: typeof setEssayT2 === 'function' ? setEssayT2 : noop,
  };

  useEffect(() => {
    if (pathname !== '/') return;
    setForceLanding(readAppQueryFlags().forceLanding);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') return;
    if (typeof window === 'undefined') return;
    const {
      setActiveTab: setTab,
      setTask1Kind: setKind,
      setPromptT1Letter: setLetter,
      setPromptT1Academic: setAcademic,
      setLetterMeta: setMeta,
      setImage: setImg,
      setEssayT1: setT1,
      setEssayT2: setT2,
    } = settersRef.current;

    try {
      const sp = new URLSearchParams(window.location.search);
      const fromQuery = sp.get('tab');
      const fromStore = sessionStorage.getItem('stratum_nav_tab');
      const t = fromQuery || fromStore;
      const tab = t === 'Topics' || t === 'Bank' ? 'Home' : t;
      if (tab === 'Home' || tab === 'Task 1' || tab === 'Task 2') {
        setTab(tab);
      }
      if (fromQuery) {
        sp.delete('tab');
        const next = sp.toString();
        window.history.replaceState({}, '', next ? `/?${next}` : '/');
      }
      if (fromStore) sessionStorage.removeItem('stratum_nav_tab');

      const studyNavRaw = sessionStorage.getItem('stratum_study_plan_nav');
      if (studyNavRaw) {
        sessionStorage.removeItem('stratum_study_plan_nav');
        const nav = JSON.parse(studyNavRaw);
        const navTab = nav.tab === 'Topics' || nav.tab === 'Bank' ? 'Home' : nav.tab;
        if (navTab === 'Home' || navTab === 'Task 1' || navTab === 'Task 2') {
          setTab(navTab);
        }
        if (nav.task1Kind === 'gt_letter' || nav.task1Kind === 'academic') {
          setKind(nav.task1Kind);
        }
      }

      const prefillRaw = sessionStorage.getItem('stratum_workspace_prefill');
      if (prefillRaw) {
        sessionStorage.removeItem('stratum_workspace_prefill');
        const p = JSON.parse(prefillRaw);
        if (p.task1Kind === 'gt_letter' || p.task1Kind === 'academic') setKind(p.task1Kind);
        if (typeof p.promptT1Letter === 'string') setLetter(p.promptT1Letter);
        if (typeof p.promptT1Academic === 'string') setAcademic(p.promptT1Academic);
        else if (typeof p.promptT1 === 'string') {
          if (p.task1Kind === 'gt_letter') setLetter(p.promptT1);
          else setAcademic(p.promptT1);
        }
        if (p.letterMeta && typeof p.letterMeta === 'object') {
          setMeta((prev) => ({ ...prev, ...p.letterMeta }));
        }
        if (typeof p.essayT1 === 'string') setT1(p.essayT1);
        if (typeof p.essayT2 === 'string') setT2(p.essayT2);
        if (!fromQuery && !fromStore && p.activeTab) {
          const prefillTab = p.activeTab === 'Topics' || p.activeTab === 'Bank' ? 'Home' : p.activeTab;
          setTab(prefillTab);
        }
        setImg(null);
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return { forceLanding, skipAppLanding };
}
