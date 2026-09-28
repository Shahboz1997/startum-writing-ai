'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BarChart3, FilePenLine, Loader2, Mail, Sparkles } from 'lucide-react';
import HomeGuidesSection from '@/components/guides/HomeGuidesSection';

const LAB_IDS = {
  chart: 'chart',
  letter: 'letter',
  essay: 'essay',
};

const LAB_TABS = [
  { id: LAB_IDS.chart, label: 'Chart', hint: 'Academic T1' },
  { id: LAB_IDS.letter, label: 'Letter', hint: 'GT T1' },
  { id: LAB_IDS.essay, label: 'Essay', hint: 'Task 2' },
];

function LabCardShell({ accent = 'indigo', children, className = '' }) {
  const borderTone =
    accent === 'teal'
      ? 'border-teal-200/80 dark:border-slate-700'
      : 'border-slate-200 dark:border-slate-700';
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-7 flex flex-col gap-4 sm:gap-5 transition-colors ${borderTone} ${className}`}
    >
      {children}
    </div>
  );
}

function LabIcon({ loading, icon: Icon, colorClass }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-3.5 rounded-xl shrink-0">
      {loading ? (
        <Loader2 className={`w-7 h-7 sm:w-8 sm:h-8 animate-spin ${colorClass}`} aria-hidden />
      ) : (
        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${colorClass}`} aria-hidden />
      )}
    </div>
  );
}

function ChartLabPanel({ isGenLoadingT1, onGenerateTask1Chart }) {
  return (
    <LabCardShell>
      <div className="flex items-start gap-3 sm:gap-4">
        <LabIcon loading={isGenLoadingT1} icon={BarChart3} colorClass="text-indigo-600 dark:text-indigo-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Academic · Task 1
          </p>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
            Chart / graph task
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Generate a data description prompt with a chart.
          </p>
        </div>
      </div>
      <button
        type="button"
        data-lab-generate="chart"
        onClick={onGenerateTask1Chart}
        disabled={isGenLoadingT1}
        className="btn-stratum w-full min-h-11 rounded-xl disabled:opacity-60"
      >
        <span className="btn-stratum-text">
          {isGenLoadingT1 ? 'Generating…' : 'Generate chart task'}
        </span>
      </button>
    </LabCardShell>
  );
}

function LetterLabPanel({ isGenLoadingLetter, onGenerateLetterTask }) {
  return (
    <LabCardShell accent="teal">
      <div className="flex items-start gap-3 sm:gap-4">
        <LabIcon loading={isGenLoadingLetter} icon={Mail} colorClass="text-teal-600 dark:text-teal-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            General Training · Task 1
          </p>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
            Letter task
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Formal or semi-formal letter with bullet points.
          </p>
        </div>
      </div>
      <button
        type="button"
        data-lab-generate="letter"
        onClick={onGenerateLetterTask}
        disabled={isGenLoadingLetter}
        className="btn-stratum w-full min-h-11 rounded-xl disabled:opacity-60"
      >
        <span className="btn-stratum-text">
          {isGenLoadingLetter ? 'Generating…' : 'Generate letter task'}
        </span>
      </button>
    </LabCardShell>
  );
}

function EssayLabPanel({
  darkMode,
  customKeyword,
  onCustomKeywordChange,
  genTopicError,
  genLoading,
  onGenerateTask2,
}) {
  return (
    <LabCardShell>
      <div className="flex items-start gap-3 sm:gap-4">
        <LabIcon loading={genLoading} icon={Sparkles} colorClass="text-indigo-600 dark:text-indigo-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Academic · Task 2
          </p>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
            Essay topic
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
            Optional keyword to steer the prompt.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <input
          value={customKeyword}
          onChange={(e) => onCustomKeywordChange(e.target.value)}
          placeholder="Keyword (optional)…"
          aria-label="Optional keyword for essay topic"
          className={`w-full min-h-11 px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500'
              : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'
          }`}
        />
        {genTopicError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {genTopicError}
          </p>
        ) : null}
        <button
          type="button"
          data-lab-generate="essay"
          onClick={onGenerateTask2}
          disabled={genLoading}
          className="btn-stratum w-full min-h-11 rounded-xl disabled:opacity-60"
        >
          <span className="btn-stratum-text">
            {genLoading ? 'Generating…' : 'Generate essay topic'}
          </span>
        </button>
      </div>
    </LabCardShell>
  );
}

function ActiveLabPanel({
  labId,
  darkMode,
  isGenLoadingT1,
  onGenerateTask1Chart,
  isGenLoadingLetter,
  onGenerateLetterTask,
  customKeyword,
  onCustomKeywordChange,
  genTopicError,
  genLoading,
  onGenerateTask2,
}) {
  if (labId === LAB_IDS.letter) {
    return (
      <LetterLabPanel
        isGenLoadingLetter={isGenLoadingLetter}
        onGenerateLetterTask={onGenerateLetterTask}
      />
    );
  }
  if (labId === LAB_IDS.essay) {
    return (
      <EssayLabPanel
        darkMode={darkMode}
        customKeyword={customKeyword}
        onCustomKeywordChange={onCustomKeywordChange}
        genTopicError={genTopicError}
        genLoading={genLoading}
        onGenerateTask2={onGenerateTask2}
      />
    );
  }
  return (
    <ChartLabPanel
      isGenLoadingT1={isGenLoadingT1}
      onGenerateTask1Chart={onGenerateTask1Chart}
    />
  );
}

export default function WriterHomeLabs({
  darkMode,
  onEvaluateDraft,
  isGenLoadingT1,
  onGenerateTask1Chart,
  isGenLoadingLetter,
  onGenerateLetterTask,
  customKeyword,
  onCustomKeywordChange,
  genTopicError,
  genLoading,
  onGenerateTask2,
}) {
  const [activeLab, setActiveLab] = useState(LAB_IDS.chart);

  const goToPracticeTasks = () => {
    setActiveLab(LAB_IDS.chart);
    const section = document.getElementById('practice-tasks');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const buttons = section?.querySelectorAll('[data-lab-generate]');
      const visible = [...(buttons || [])].find((btn) => {
        const style = window.getComputedStyle(btn);
        return style.display !== 'none' && style.visibility !== 'hidden' && btn.offsetParent !== null;
      });
      visible?.focus({ preventScroll: true });
    }, 380);
  };

  const labProps = {
    darkMode,
    isGenLoadingT1,
    onGenerateTask1Chart,
    isGenLoadingLetter,
    onGenerateLetterTask,
    customKeyword,
    onCustomKeywordChange,
    genTopicError,
    genLoading,
    onGenerateTask2,
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 animate-in fade-in duration-500">
      <header className="space-y-5 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Start writing
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base font-medium px-2">
            Evaluate a draft you already have, or generate a practice task.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onEvaluateDraft}
            className="group flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:hover:border-indigo-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <FilePenLine className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                Evaluate my draft
              </span>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Opens Task 2 — paste essay, get band feedback
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>

          <button
            type="button"
            onClick={goToPracticeTasks}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-slate-900 dark:text-white">
                Generate a task
              </span>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Jump to Chart / Letter / Essay labs below
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </div>
      </header>

      <section id="practice-tasks" className="scroll-mt-24 space-y-4 sm:space-y-5" aria-labelledby="practice-tasks-heading">
        <div className="px-0.5">
          <h2
            id="practice-tasks-heading"
            className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Practice tasks
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Pick a task type, then generate a prompt.
          </p>
        </div>

        {/* Mobile: one lab at a time via tabs */}
        <div className="sm:hidden space-y-3">
          <div
            role="tablist"
            aria-label="Task type"
            className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80"
          >
            {LAB_TABS.map((tab) => {
              const selected = activeLab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`lab-tab-${tab.id}`}
                  aria-controls={`lab-panel-${tab.id}`}
                  onClick={() => setActiveLab(tab.id)}
                  className={`min-h-11 rounded-lg px-2 py-2 text-center transition-colors ${
                    selected
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="block text-xs font-extrabold tracking-tight">{tab.label}</span>
                  <span className="block text-[10px] font-medium opacity-70 mt-0.5">{tab.hint}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeLab}
              role="tabpanel"
              id={`lab-panel-${activeLab}`}
              aria-labelledby={`lab-tab-${activeLab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <ActiveLabPanel labId={activeLab} {...labProps} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tablet / desktop: all three visible */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 items-stretch">
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 dark:bg-indigo-500 rounded-full" aria-hidden />
              Task 1 · Chart
            </h3>
            <ChartLabPanel
              isGenLoadingT1={isGenLoadingT1}
              onGenerateTask1Chart={onGenerateTask1Chart}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-teal-600 dark:bg-teal-500 rounded-full" aria-hidden />
              Task 1 · Letter
            </h3>
            <LetterLabPanel
              isGenLoadingLetter={isGenLoadingLetter}
              onGenerateLetterTask={onGenerateLetterTask}
            />
          </div>
          <div className="flex flex-col gap-2.5 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 dark:bg-indigo-500 rounded-full" aria-hidden />
              Task 2 · Essay
            </h3>
            <EssayLabPanel
              darkMode={darkMode}
              customKeyword={customKeyword}
              onCustomKeywordChange={onCustomKeywordChange}
              genTopicError={genTopicError}
              genLoading={genLoading}
              onGenerateTask2={onGenerateTask2}
            />
          </div>
        </div>
      </section>

      <HomeGuidesSection />
    </div>
  );
}
