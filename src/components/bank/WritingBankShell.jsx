'use client';

import React, { useState } from 'react';
import BankList from '@/components/BankList';
import TemplatesBank from './TemplatesBank';

/**
 * Inner tabs: exam topics vs writing templates (IELTS Writing bank)
 */
export default function WritingBankShell({ darkMode }) {
  const [inner, setInner] = useState('topics');

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setInner(id)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-tight transition-all ${
        inner === id
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <header className="text-center space-y-3">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Writing <span className="text-indigo-600 dark:text-indigo-400">Bank</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium max-w-xl mx-auto">
          Practice prompts and reusable essay structures for IELTS Academic Writing.
        </p>
      </header>

      <div className="flex justify-center">
        <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {tabBtn('topics', 'Topics')}
          {tabBtn('templates', 'Templates')}
        </div>
      </div>

      {inner === 'topics' ? <BankList darkMode={darkMode} /> : <TemplatesBank darkMode={darkMode} />}
    </div>
  );
}
