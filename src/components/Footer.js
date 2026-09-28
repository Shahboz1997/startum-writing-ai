'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import FacebookIcon from '@/components/icons/FacebookIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import TelegramIcon from '@/components/icons/TelegramIcon';
import {
  BUSINESS_ADDRESS,
  COPYRIGHT_LINE,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_TEL,
  CONTACT_SUPPORT_LABEL,
  FACEBOOK_PAGE_LABEL,
  FACEBOOK_PAGE_URL,
  INSTAGRAM_PAGE_LABEL,
  INSTAGRAM_PAGE_URL,
  TELEGRAM_CHANNEL_LABEL,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/support';
import { trackTelegramClick } from '@/lib/analyticsEvents';

export default function Footer() {
  return (
    <footer className="bg-[#F9FAFB] dark:bg-[#050505] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-6 h-6 text-indigo-500 dark:text-indigo-400 transition-transform duration-200 hover:scale-110 [filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]" strokeWidth={1.5} />
              <span className="font-black tracking-tighter normal-case text-slate-900 dark:text-white">STRATUM</span>
            </div>
            <p className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
              AI-powered IELTS Writing feedback based on official band descriptors.
            </p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#sample-reports" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sample report</Link></li>
              <li><Link href="/#how-it-works" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</Link></li>
              <li><Link href="/guides" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Free Guides</Link></li>
              <li><Link href="/pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link href="/ielts-writing-task-2-ai-checker" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Task 2 checker</Link></li>
              <li><Link href="/ielts-academic-task-1-band-score-checker" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Task 1 checker</Link></li>
              <li><Link href="/ielts-general-training-letter-feedback" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">GT letter feedback</Link></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/data-deletion" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Data Deletion</Link></li>
              <li><Link href="/terms" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-4 text-sm">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={SUPPORT_PHONE_TEL}
                  className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {CONTACT_SUPPORT_LABEL}
                </a>
              </li>
              <li className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 leading-relaxed">
                {BUSINESS_ADDRESS}
              </li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Top-up Credits</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center space-y-2">
          <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            {COPYRIGHT_LINE}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 text-xs text-slate-500 dark:text-slate-400">
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={TELEGRAM_CHANNEL_LABEL}
              className="inline-flex items-center hover:text-[#229ED9] dark:hover:text-[#229ED9] transition-colors"
              onClick={() => trackTelegramClick({ target: 'channel', placement: 'footer' })}
            >
              <TelegramIcon className="h-4 w-4 shrink-0 text-[#229ED9]" />
            </a>
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={FACEBOOK_PAGE_LABEL}
              className="inline-flex items-center hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-colors"
            >
              <FacebookIcon className="h-4 w-4 shrink-0 text-[#1877F2]" />
            </a>
            <a
              href={INSTAGRAM_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={INSTAGRAM_PAGE_LABEL}
              className="inline-flex items-center hover:text-[#E4405F] dark:hover:text-[#E4405F] transition-colors"
            >
              <InstagramIcon className="h-4 w-4 shrink-0 text-[#E4405F]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
