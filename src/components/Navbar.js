import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useTheme } from 'next-themes';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Zap, Sun, Moon, Menu, X, 
  CreditCard, ShieldCheck, ChevronDown, LogOut,
} from 'lucide-react';
import { useBilling } from '@/components/BillingContext';

// --- ФОРМА ОПЛАТЫ STRIPE ---
const CheckoutForm = ({ plan, darkMode, onClose, isAgreed }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !isAgreed) return;
    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card', card: cardElement,
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else {
      if (typeof window !== 'undefined' && typeof window.gtagSendEvent === 'function') {
        window.gtagSendEvent();
      }
      alert(`Success! ${plan.name} activated.`);
      setProcessing(false);
      onClose();
    }
  };

  const canSubmit = isAgreed && !processing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: darkMode ? '#fff' : '#000', '::placeholder': { color: '#64748b' } },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-[10px] font-black uppercase text-center">{error}</div>}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full min-h-[44px] py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
            canSubmit
              ? 'btn-stratum hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-50 cursor-not-allowed'
          }`}
        >
        {canSubmit && <div className="shimmer-layer animate-shimmer" aria-hidden />}
        <span className={canSubmit ? 'btn-stratum-text' : ''}>{processing ? 'PROCESSING...' : plan.price === '3.99$' ? 'START TRIAL · STRATUM' : `PAY ${plan?.price} · STRATUM`}</span>
      </button>
    </form>
  );
};
const Navbar = ({ 
  activeTab, setActiveTab, darkMode: darkModeProp, setDarkMode: setDarkModeProp, 
  isMenuOpen, setIsMenuOpen, onLoginClick,
  credits: creditsProp,
}) => {
  const { data: session, status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeMounted && resolvedTheme === 'dark');

  const isLoggedIn = status === "authenticated";
  const credits =
    typeof creditsProp === 'number'
      ? creditsProp
      : (session?.user?.credits || 0);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [confirmLogoutMobile, setConfirmLogoutMobile] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeLoadError, setStripeLoadError] = useState(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk || !pk.startsWith('pk_')) {
      setStripeLoadError('Stripe key not configured');
      return;
    }
    let cancelled = false;
    loadStripe(pk)
      .then((stripe) => {
        if (!cancelled && stripe) setStripePromise(Promise.resolve(stripe));
      })
      .catch(() => {
        if (!cancelled) setStripeLoadError('Failed to load Stripe.js');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedPlan) setIsAgreed(false);
  }, [selectedPlan]);

  useEffect(() => {
    if (!isMenuOpen) setConfirmLogoutMobile(false);
  }, [isMenuOpen]);

  const menuItems = ['Topics', 'Bank', 'Task 1', 'Task 2', 'Archive'];
  const handleThemeToggle = () => {
    if (!themeMounted) return;
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  
  const plans = [
    { name: 'Trial', price: '3.99$', desc: '3 Days FREE, then 3.99$ per 5 days' },
    { name: 'Monthly', price: '14.99$', desc: 'Full access for 30 days' },
    { name: 'Yearly', price: '39.99$', desc: 'Best value - Save 70% yearly' },
  ];

  // ... остальной код
  return (
    <>
      <nav className={`sticky top-0 z-50 p-4 border-b border-white/5 backdrop-blur-md transition-colors duration-300 ${
        darkMode ? 'bg-[#050505]/90' : 'bg-[#F9FAFB]/90'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo: STRATUM.ai — bold, wide-tracked, accent on dot */}
          <button
            type="button"
            onClick={() => setActiveTab('Topics')}
            className="group flex items-center gap-2 text-xl sm:text-2xl font-black tracking-[0.15em] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded uppercase"
            aria-label="Go to Topics"
          >
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400 shrink-0 transition-transform duration-200 group-hover:scale-110 [filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]" strokeWidth={1.5} />
            <span className={darkMode ? 'text-white' : 'text-slate-900'}>
              STRATUM<span className="text-indigo-500 dark:text-indigo-400">.</span>ai
            </span>
          </button>

          {/* ДЕСКТОПНОЕ МЕНЮ (Скрыто на мобилках) */}
          <div className="hidden md:flex items-center gap-6">
            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {menuItems.map((item) =>
                item === 'Archive' ? (
                  <Link key={item} href="/history" className={`px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-tighter transition-all block ${activeTab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}>{item}</Link>
                ) : (
                  <button key={item} type="button" onClick={() => setActiveTab(item)} className={`px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-tighter transition-all ${activeTab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}>{item}</button>
                )
              )}
            </div>

            <div className="flex items-center gap-4 border-l pl-6 border-slate-700/30">
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
          {/* Кредиты */}
          <div className="flex items-center gap-1 font-semibold text-xs text-indigo-600 bg-indigo-600/10 px-2 py-1 rounded-lg tracking-tight">
            {credits} <Zap className="w-3 h-3 inline-block" strokeWidth={1.5} />
          </div>
          
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
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      Profile
                    </Link>
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
                <button type="button" onClick={() => onLoginClick()} className="btn-stratum min-h-[44px] px-4 py-2 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                  <div className="shimmer-layer animate-shimmer" aria-hidden />
                  <span className="btn-stratum-text">STRATUM LOGIN</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleThemeToggle}
                disabled={!themeMounted}
                className="group flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                aria-label={themeMounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {themeMounted && resolvedTheme === 'dark' ? <Sun className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> : <Moon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* КНОПКА БУРГЕРА (Только мобильные, <768px) */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> : <Menu className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* МОБИЛЬНОЕ ВЫПАДАЮЩЕЕ МЕНЮ (Pricing + Theme + Nav) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-inherit">
              <div className="flex flex-col p-4 space-y-4 border-t dark:border-slate-800 mt-4">
                
                {/* 1. Навигация */}
                <div className="grid grid-cols-2 gap-2">
                  {menuItems.map((item) =>
                    item === 'Archive' ? (
                      <Link key={item} href="/history" onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center block text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${activeTab === item ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white/5 dark:bg-white/5 border border-white/5'}`}>{item}</Link>
                    ) : (
                      <button key={item} type="button" onClick={() => { setActiveTab(item); setIsMenuOpen(false); }} className={`flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${activeTab === item ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white/5 dark:bg-white/5 border border-white/5'}`}>{item}</button>
                    )
                  )}
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

                {/* 3. Утилиты: Theme, Login (or Logout when logged in) */}
                <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={handleThemeToggle}
                     disabled={!themeMounted}
                     className="flex-1 min-h-[44px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-3 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                   >
                     {themeMounted && resolvedTheme === 'dark' ? <><Sun className="w-5 h-5" strokeWidth={1.5} /> Day</> : <><Moon className="w-5 h-5" strokeWidth={1.5} /> Night</>}
                   </button>
                   {!isLoggedIn ? (
                     <button type="button" onClick={() => onLoginClick()} className="btn-stratum flex-1 min-h-[44px] p-4 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                       <div className="shimmer-layer animate-shimmer" aria-hidden />
                       <span className="btn-stratum-text">STRATUM LOGIN</span>
                     </button>
                   ) : null}
                </div>

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

      {/* STRIPE PAYMENT MODAL */}
      <AnimatePresence>
        {selectedPlan && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPlan(null)} className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md" aria-hidden="true" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative z-[101] w-full max-w-md p-4 sm:p-8 rounded-3xl shadow-2xl shadow-black/15 my-auto max-h-[100dvh] overflow-y-auto border border-white/5 backdrop-blur-md ${darkMode ? 'bg-slate-900/95 text-white' : 'bg-white/95 text-slate-900'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className="italic font-black uppercase text-2xl tracking-tighter">
                  <h3>{selectedPlan.price === '0$' ? 'Start Trial' : 'Checkout'}</h3>
                </div>
                <button type="button" onClick={() => setSelectedPlan(null)} className="group flex items-center justify-center min-h-[44px] min-w-[44px] p-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-full transition-colors" aria-label="Close"><X className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /></button>
              </div>

              <div className={`mb-8 p-5 rounded-2xl border-2 border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-slate-500">{selectedPlan.name} Plan</span>
                  <span className="text-2xl font-semibold text-indigo-600">{selectedPlan.price}</span>
                </div>
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-tight">{selectedPlan.desc}</p>
              </div>

              <label className={`flex items-start gap-3 mb-6 cursor-pointer select-none ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-red-600 focus:ring-red-500 focus:ring-offset-0 dark:focus:ring-offset-slate-900 accent-red-600"
                />
                <span className="text-sm font-medium tracking-tight">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/refund" target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 hover:underline">
                    Refund Policy
                  </Link>
                  .
                </span>
              </label>

              {stripeLoadError && (
                <div className="py-4 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm text-center">
                  {stripeLoadError}. Add <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">.env.local</code> with your Stripe publishable key (pk_test_... or pk_live_...).
                </div>
              )}
              {!stripeLoadError && !stripePromise && (
                <div className="py-8 text-slate-500 dark:text-slate-400 text-sm text-center">Loading payment form…</div>
              )}
              {!stripeLoadError && stripePromise && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm plan={selectedPlan} darkMode={darkMode} onClose={() => setSelectedPlan(null)} isAgreed={isAgreed} />
                </Elements>
              )}

              <div className="mt-8 flex justify-center items-center gap-2 text-[9px] font-black uppercase text-slate-500 opacity-50 italic">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} /> 256-bit Encrypted Secure Payment
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
