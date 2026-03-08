'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Layers,
  BarChart3,
  PenTool,
  Clock,
  Sliders,
  LogOut,
  User,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const mainNavItems = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'My Checks', href: '/history', icon: Clock },
  { name: 'Writer', href: '/', icon: PenTool },
];

const bottomNavItems = [
  { name: 'Settings', href: '/settings', icon: Sliders },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

export default function Sidebar({ user, credits }) {
  const pathname = usePathname();

  const NavLink = ({ item, isActive, isMobile = false }) => {
    const Icon = item.icon;
    const content = (
      <motion.div
        className={`
          group relative flex items-center justify-center sm:justify-start gap-3 min-h-[44px] sm:min-h-[48px]
          px-3 py-3 rounded-xl font-semibold tracking-tight
          transition-all duration-200
          ${isActive
            ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400'
          }
          hover:text-indigo-600 dark:hover:text-indigo-400
          hover:shadow-[0_0_20px_rgba(79,70,229,0.15)]
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-full bg-indigo-600 dark:bg-indigo-400"
            aria-hidden
          />
        )}
        <Icon className={`w-5 h-5 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isActive ? '[filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]' : ''}`} strokeWidth={1.5} />
        {!isMobile && <span className="hidden sm:inline">{item.name}</span>}
      </motion.div>
    );
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop / Tablet: vertical sidebar */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="
          hidden sm:flex sm:flex-col sm:fixed sm:inset-y-0 sm:left-0 sm:z-30
          w-64 h-screen
          bg-white/80 dark:bg-[#050505]/90 backdrop-blur-md
          border-r border-white/5 dark:border-white/5
          p-4
        "
      >
        {/* Logo: STRATUM.ai — Layers icon + bold, wide-tracked */}
        <motion.div
          className="flex items-center gap-2 mb-8 px-2 group"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Layers className="w-5 h-5 shrink-0 text-indigo-500 dark:text-indigo-400 transition-transform duration-200 group-hover:scale-110 [filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]" strokeWidth={1.5} />
          <motion.span
            className="font-black tracking-[0.2em] text-lg text-slate-900 dark:text-slate-100 select-none uppercase"
            style={{ textShadow: '0 0 20px rgba(99,102,241,0.2)' }}
            animate={{ opacity: [1, 0.9, 1] }}
            transition={{ opacity: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}}
          >
            STRATUM<span className="text-indigo-500 dark:text-indigo-400">.</span>ai
          </motion.span>
        </motion.div>

        {/* Main nav */}
        <motion.nav
          className="flex-1 space-y-0.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div key={item.href} variants={itemVariants}>
                <NavLink item={item} isActive={isActive} />
              </motion.div>
            );
          })}
        </motion.nav>

        {/* Bottom: User profile + Settings + Sign out */}
        <motion.div
          className="mt-auto pt-4 border-t border-white/5 dark:border-white/5 space-y-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {user && (
            <div className="flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <User className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              </div>
              <div className="hidden sm:block min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {user.name || user.email || 'User'}
                </p>
                {credits != null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {credits} credits
                  </p>
                )}
              </div>
            </div>
          )}
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div key={item.href} variants={itemVariants}>
                <NavLink item={item} isActive={isActive} />
              </motion.div>
            );
          })}
          <motion.div variants={itemVariants}>
            <button
              type="button"
              onClick={() => signOut()}
              className="group relative flex items-center justify-start gap-3 w-full min-h-[48px] px-3 py-3 rounded-xl font-semibold tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-[0_0_20px_rgba(79,70,229,0.12)] transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </motion.div>
        </motion.div>
      </motion.aside>

      {/* Mobile: bottom tab bar */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="
          sm:hidden fixed bottom-0 left-0 right-0 z-50
          h-16 w-full
          bg-white/80 dark:bg-[#050505]/90 backdrop-blur-md
          border-t border-white/5 dark:border-white/5
          flex items-center justify-center gap-0
        "
      >
        <div className="flex items-center justify-center gap-2 w-full max-w-md px-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center min-h-[56px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  className={`group flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 hover:scale-110 ${isActive ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 [&_svg]:[filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]' : ''}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </motion.span>
                <span className="text-[10px] font-medium mt-0.5 truncate max-w-[72px]">
                  {item.name}
                </span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="flex-1 flex flex-col items-center justify-center min-h-[56px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <motion.span
              whileTap={{ scale: 0.92 }}
              className={`group flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 hover:scale-110 ${pathname === '/settings' ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 [&_svg]:[filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]' : ''}`}
            >
              <Sliders className="w-5 h-5" strokeWidth={1.5} />
            </motion.span>
            <span className="text-[10px] font-medium mt-0.5">Settings</span>
          </Link>
        </div>
      </motion.nav>
    </>
  );
}
