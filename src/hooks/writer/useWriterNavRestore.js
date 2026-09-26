import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
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

/** Subscribe to URL search changes (back/forward + pushState/replaceState). */
function subscribeAppQuery(onStoreChange) {
  if (typeof window === 'undefined') return () => {};
  const fire = () => onStoreChange();
  window.addEventListener('popstate', fire);
  window.addEventListener('stratum:query', fire);
  return () => {
    window.removeEventListener('popstate', fire);
    window.removeEventListener('stratum:query', fire);
  };
}

function noop() {}

function asSetter(fn) {
  return typeof fn === 'function' ? fn : noop;
}

export function useWriterNavRestore({
  forceLandingFromServer = false,
  skipAppLandingFromServer = false,
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
  // SSR + hydration must share the same snapshot (from page searchParams). Client then reads live URL.
  const forceLanding = useSyncExternalStore(
    subscribeAppQuery,
    () => readAppQueryFlags().forceLanding,
    () => Boolean(forceLandingFromServer),
  );
  const skipAppLanding = useSyncExternalStore(
    subscribeAppQuery,
    () => readAppQueryFlags().skipAppLanding,
    () => Boolean(skipAppLandingFromServer),
  );

  // Keep setters in refs so the restore effect deps stay a fixed size (avoids HMR / undefined setter churn).
  // Sync in layout effect — writing refs during render trips react-hooks/refs (CI lint error).
  const settersRef = useRef({
    setActiveTab: asSetter(setActiveTab),
    setTask1Kind: asSetter(setTask1Kind),
    setPromptT1Letter: asSetter(setPromptT1Letter),
    setPromptT1Academic: asSetter(setPromptT1Academic),
    setLetterMeta: asSetter(setLetterMeta),
    setImage: asSetter(setImage),
    setEssayT1: asSetter(setEssayT1),
    setEssayT2: asSetter(setEssayT2),
  });
  useLayoutEffect(() => {
    settersRef.current = {
      setActiveTab: asSetter(setActiveTab),
      setTask1Kind: asSetter(setTask1Kind),
      setPromptT1Letter: asSetter(setPromptT1Letter),
      setPromptT1Academic: asSetter(setPromptT1Academic),
      setLetterMeta: asSetter(setLetterMeta),
      setImage: asSetter(setImage),
      setEssayT1: asSetter(setEssayT1),
      setEssayT2: asSetter(setEssayT2),
    };
  });

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
        window.dispatchEvent(new Event('stratum:query'));
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
