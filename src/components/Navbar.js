import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { 
  Zap, Menu, X, 
  ChevronDown, LogOut, UserRound,
} from 'lucide-react';
const Navbar = ({ 
  activeTab, setActiveTab,
  isMenuOpen, setIsMenuOpen, onLoginClick,
  credits: creditsProp,
  guestQuotaRemaining = null,
  onCreditsClick,
}) => {
  const { data: session, status } = useSession();
  // Defer auth chrome until after mount so SSR HTML matches the first client paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isLoggedIn = mounted && status === "authenticated";
  const credits =
    typeof creditsProp === 'number'
      ? creditsProp
      : (session?.user?.credits ?? 0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [confirmLogoutMobile, setConfirmLogoutMobile] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) setConfirmLogoutMobile(false);
  }, [isMenuOpen]);

  const primaryItems = ['Task 1', 'Task 2'];
  const secondaryItems = ['Home', 'Archive', 'Study plan'];
  const menuItems = ['Home', ...primaryItems, 'Archive', 'Study plan'];

  const renderNavLinkItem = (item, baseClass, opts = {}) => {
    const { onNavigate, layoutId = 'desktop-nav-pill', asButtonClass } = opts;
    const isActive = activeTab === item;
    const className = asButtonClass || baseClass;

    if (item === 'Archive') {
      if (isLoggedIn) {
        return (
          <Link key={item} href="/history" onClick={onNavigate} className={className}>
            {isActive && layoutId ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{item}</span>
          </Link>
        );
      }
      return (
        <button
          key={item}
          type="button"
          onClick={() => {
            onNavigate?.();
            onLoginClick?.('Sign in to view your archive.');
          }}
          className={className}
        >
          {isActive && layoutId ? (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          ) : null}
          <span className="relative z-10">{item}</span>
        </button>
      );
    }

    if (item === 'Study plan') {
      const planLabel = layoutId ? 'Plan' : 'Study plan';
      if (isLoggedIn) {
        return (
          <Link
            key={item}
            href="/study-plan"
            onClick={onNavigate}
            className={className}
            aria-label="Study plan"
          >
            {isActive && layoutId ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            ) : null}
            <span className="relative z-10">{planLabel}</span>
          </Link>
        );
      }
      return (
        <button
          key={item}
          type="button"
          onClick={() => {
            onNavigate?.();
            onLoginClick?.('Sign in to open your Study plan.');
          }}
          className={className}
          aria-label="Study plan"
        >
          <span className="relative z-10">{planLabel}</span>
        </button>
      );
    }

    return (
      <button
        key={item}
        type="button"
        onClick={() => {
          setActiveTab(item);
          onNavigate?.();
        }}
        aria-current={isActive ? 'page' : undefined}
        className={className}
      >
        {isActive && layoutId ? (
          <motion.span
            layoutId={layoutId}
            className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        ) : null}
        <span className="relative z-10">{item}</span>
      </button>
    );
  };
  
  return (
    <>
      <nav
        suppressHydrationWarning
        className="sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 bg-white/80 border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:bg-[#050505]/80 dark:border-white/[0.06] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 min-[400px]:gap-3 sm:gap-4 md:flex md:justify-between min-h-[52px] md:min-h-[56px] py-2 md:py-2.5">

          {/* Block 1: Logo */}
          <div className="flex items-center shrink-0 justify-self-start">
            <button
              type="button"
              onClick={() => setActiveTab('Home')}
              className="group flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-2 font-black cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg shrink-0 transition-all duration-200 max-w-[42vw] min-[400px]:max-w-none"
              aria-label="Go to Home"
            >
              <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 ring-1 ring-indigo-500/20 transition-all duration-200 group-hover:bg-indigo-500/15 group-hover:ring-indigo-500/30 group-active:scale-95">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              </span>
              <span className="inline truncate normal-case text-[10px] min-[400px]:text-base sm:text-xl md:text-2xl tracking-[0.1em] min-[400px]:tracking-[0.12em] sm:tracking-[0.15em] text-slate-900 dark:text-white">
                STRATUM
              </span>
            </button>
          </div>

          {/* Block 2: Tasks (mobile) / Navigation (desktop) */}
          <div className="flex flex-row min-w-0 items-center justify-center justify-self-center md:flex-none md:justify-start">
            {/* Task 1 / Task 2 — mobile segmented control */}
            <div
              className="md:hidden relative flex flex-row items-center justify-center gap-1 min-[400px]:gap-2 p-1 rounded-full shrink-0 bg-slate-100/90 ring-1 ring-slate-200/80 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] dark:bg-slate-800/80 dark:ring-white/[0.06] dark:shadow-none"
              role="tablist"
              aria-label="Task selection"
            >
              {primaryItems.map((item) => {
                const isActive = activeTab === item;
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(item)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative z-10 flex-1 basis-0 min-w-[3.25rem] max-w-[5.5rem] px-3 py-1 rounded-full font-bold text-[10px] min-[400px]:text-[11px] uppercase tracking-wide text-center whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="mobile-task-pill"
                        className="absolute inset-0 rounded-full bg-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.35)] ring-1 ring-indigo-500/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 truncate">
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center">
            <div className="flex p-1 rounded-full gap-0.5 bg-slate-100/90 ring-1 ring-slate-200/80 dark:bg-slate-800/80 dark:ring-white/[0.06]">
              {menuItems.map((item) => {
                const isActive = activeTab === item;
                const baseClass = `relative px-3 lg:px-4 py-2 rounded-full font-bold text-[11px] uppercase tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`;
                return renderNavLinkItem(item, baseClass);
              })}
            </div>
            </div>
          </div>

          {/* Block 3: Credits, auth, theme (desktop) / Credits + burger (mobile) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-self-end">
            <div className="hidden md:flex items-center gap-4 border-l pl-4 border-slate-700/30">
              {/* <div className="relative">
                <button type="button" onClick={() => setIsPricingOpen(!isPricingOpen)} className="flex items-center gap-2 min-h-[44px] px-3 py-2 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all">
                  <CreditCard className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> Pricing
                </button>
                <AnimatePresence>
                  {isPricingOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute right-0 mt-3 w-64 p-4 rounded-3xl shadow-2xl shadow-black/10 border border-white/5 backdrop-blur-md ${darkMode ? 'bg-slate-900/90' : 'bg-white/95'}`}>
                       {plans.map(p => (
                          <div key={p.name} onClick={() => { setSelectedPlan(p); setIsPricingOpen(false); }} className="p-3 mb-1 rounded-xl cursor-pointer font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-all">
                             <div className="flex justify-between"><span>{p.name}</span><span className="text-indigo-600">{p.price}</span></div>
                             <div className="text-[8px] opacity-60 tracking-tighter">{p.desc}</div>
                          </div>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div> */}
            {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onCreditsClick?.()}
            className="flex items-center gap-1 font-semibold text-xs text-indigo-600 bg-indigo-600/10 px-2 py-1 rounded-lg tracking-tight hover:bg-indigo-600/15 transition-colors"
            title={onCreditsClick ? 'View credit packages' : 'Account credits'}
            aria-label={onCreditsClick ? 'View credit packages' : 'Account credits'}
          >
            {credits} <Zap className="w-3 h-3 inline-block" strokeWidth={1.5} />
          </button>
          
          {/* User dropdown: Profile, Billing, Logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-48 py-1 rounded-3xl shadow-2xl shadow-black/10 border border-white/5 backdrop-blur-md z-50 bg-white/95 dark:bg-slate-900/95"
                  >
                    <Link
                      href="/study-plan"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      Study plan
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      Account
                    </Link>
                    {typeof onCreditsClick === 'function' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onCreditsClick();
                        }}
                        className="w-full text-left flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                      >
                        Top up credits
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { signOut({ callbackUrl: '/' }); setIsUserMenuOpen(false); }}
                      className="w-full text-left flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-t border-slate-100 dark:border-slate-800"
                    >
                      <LogOut className="w-4 h-4 mr-2 shrink-0" strokeWidth={1.5} />
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
              ) : (
                <>
                  {typeof guestQuotaRemaining === 'number' && guestQuotaRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => onLoginClick?.()}
                      className="hidden sm:flex items-center gap-1 font-semibold text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg tracking-tight hover:bg-amber-500/20 transition-colors"
                      title="One free demo check on this network — sign in for archive and credits"
                    >
                      Demo
                    </button>
                  )}
                  <button type="button" onClick={() => onLoginClick()} data-testid="open-auth-login" className="btn-stratum min-h-[44px] px-4 py-2 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                    <div className="shimmer-layer animate-shimmer" aria-hidden />
                    <span className="btn-stratum-text">STRATUM LOGIN</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile: credits + burger */}
            <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => onCreditsClick?.()}
                className="flex items-center gap-1 font-semibold text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full ring-1 ring-indigo-500/15 tracking-tight whitespace-nowrap hover:bg-indigo-500/15 transition-colors"
                title={onCreditsClick ? 'View credit packages' : 'Account credits'}
                aria-label={onCreditsClick ? 'View credit packages' : 'Account credits'}
              >
                {credits} <Zap className="w-3 h-3 inline-block" strokeWidth={2} />
              </button>
            ) : (
              typeof guestQuotaRemaining === 'number' && guestQuotaRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => onLoginClick?.()}
                  className="flex items-center gap-0.5 font-semibold text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-full ring-1 ring-amber-500/20 tracking-tight whitespace-nowrap hover:bg-amber-500/20 transition-all duration-200 active:scale-95"
                  title="Sign in for archive and full analysis"
                >
                  Demo
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 ring-1 ring-slate-200/60 dark:ring-white/[0.06] hover:ring-indigo-300/50 dark:hover:ring-indigo-500/30 transition-all duration-200 active:scale-95"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-[18px] h-[18px]" strokeWidth={2} /> : <Menu className="w-[18px] h-[18px]" strokeWidth={2} />}
            </button>
            </div>
          </div>
          </div>
        </div>

        {/* МОБИЛЬНОЕ ВЫПАДАЮЩЕЕ МЕНЮ */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-inherit">
              <div className="flex flex-col p-4 space-y-4 border-t dark:border-slate-800 mt-4">

                {isLoggedIn ? (
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        session?.user?.name?.charAt(0) || <UserRound className="h-5 w-5" strokeWidth={1.75} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {session?.user?.name || 'Account'}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        Account settings
                      </span>
                    </span>
                  </Link>
                ) : null}
                
                {/* 1. Навигация */}
                <div className="grid grid-cols-2 gap-2">
                  {secondaryItems.map((item) => {
                    const mobileClass = `relative flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${
                      activeTab === item
                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20'
                        : 'bg-white/5 dark:bg-white/5 border border-white/5'
                    }`;
                    return renderNavLinkItem(item, mobileClass, {
                      onNavigate: () => setIsMenuOpen(false),
                      layoutId: null,
                      asButtonClass: mobileClass,
                    });
                  })}
                </div>

                {/* 2. Блок Pricing внутри бургера
                <div className={`p-4 rounded-3xl border border-white/5 backdrop-blur-md ${darkMode ? 'bg-white/5' : 'bg-white/80'}`}>
                  <h4 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" strokeWidth={1.5} /> Subscription Plans</h4>
                  <div className="space-y-2">
                    {plans.map(p => (
                      <button key={p.name} type="button" onClick={() => { setSelectedPlan(p); setIsMenuOpen(false); }} className="w-full flex justify-between items-center min-h-[44px] p-4 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-700 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="text-left leading-tight">
                          <div className="text-[10px] font-black uppercase dark:text-white">{p.name}</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">{p.desc}</div>
                        </div>
                        <div className="text-indigo-600 font-semibold text-xs">{p.price}</div>
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* 3. Login (Logout is a separate row when signed in) */}
                {!isLoggedIn ? (
                  <button type="button" onClick={() => onLoginClick()} data-testid="open-auth-login" className="btn-stratum w-full min-h-[44px] p-4 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                    <div className="shimmer-layer animate-shimmer" aria-hidden />
                    <span className="btn-stratum-text">STRATUM LOGIN</span>
                  </button>
                ) : null}

                {/* 4. Logout row (mobile) — prominent, fat-finger friendly, optional confirm */}
                {isLoggedIn && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmLogoutMobile) {
                          signOut({ callbackUrl: '/' });
                          setIsMenuOpen(false);
                        } else {
                          setConfirmLogoutMobile(true);
                        }
                      }}
                      className="
                        w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl
                        font-black uppercase tracking-[0.2em] text-[10px]
                        text-slate-500 dark:text-slate-400
                        hover:text-red-500 hover:bg-red-500/10 active:text-red-500 active:bg-red-500/10
                        transition-colors
                      "
                    >
                      <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                      <span>{confirmLogoutMobile ? 'Tap again to sign out' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

    </>
  );
};

export default Navbar;
