'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#F9FAFB] dark:bg-[#050505] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-6 h-6 text-indigo-500 dark:text-indigo-400 transition-transform duration-200 hover:scale-110 [filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]" strokeWidth={1.5} />
              <span className="font-black tracking-tighter uppercase text-slate-900 dark:text-white">STRATUM<span className="text-indigo-500 dark:text-indigo-400">.</span>ai</span>
            </div>
            <p className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
              AI-powered IELTS Writing feedback based on official band descriptors.
            </p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/#pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Top-up Credits</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center space-y-2">
          <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            © 2026 STRATUM LLC. Registered in Wyoming, USA. All rights reserved. 30 N Gould St Ste R, Sheridan, WY 82801, USA
          </p>
        </div>
      </div>
    </footer>
  );
}
