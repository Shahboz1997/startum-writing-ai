'use client';
import React, { useState, useMemo } from 'react';
import { format } from "date-fns";
import { FileText, ChevronRight, Star, Search, SortDesc, SortAsc, Filter, Clock, Download } from "lucide-react";
import Link from "next/link";
import { generateStratumWritingPdfFromCheck } from "@/lib/stratumWritingPdf";
import { EmptyState } from "@/components/stratum";

export default function HistoryClientWrapper({ initialData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState('0');
  const [sortOrder, setSortOrder] = useState('desc');
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (e, check) => {
    e.preventDefault();
    e.stopPropagation();
    if (!check) return;
    setDownloadingId(check.id);
    try {
      generateStratumWritingPdfFromCheck(check);
    } finally {
      setDownloadingId(null);
    }
  };

  // Логика фильтрации и сортировки
  const filteredChecks = useMemo(() => {
    return initialData
      .filter(check => {
        const haystack = `${check.content || ''}\n${check.promptText || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesScore = (check.score ?? 0) >= parseFloat(minScore);
        return matchesSearch && matchesScore;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [searchTerm, minScore, sortOrder, initialData]);

  return (
    <div className="space-y-6">
      {/* Filters panel — STRATUM.ai glassmorphism */}
      <div className="grid grid-cols-1 md:flex items-center gap-4 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
        
        {/* Поиск */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Search essay content..." 
            className="w-full min-h-[44px] pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-500 font-bold text-[10px] uppercase transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Фильтр по баллу */}
        <div className="flex items-center gap-2 px-4 min-h-[44px] bg-slate-50 dark:bg-slate-800 rounded-2xl border border-white/5">
          <Filter className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={1.5} />
          <select 
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="flex-1 min-h-[44px] bg-transparent outline-none font-black text-[10px] uppercase cursor-pointer dark:text-white py-2"
          >
            <option value="0">Min Score</option>
            {[4, 5, 6, 7, 8, 9].map(score => (
              <option key={score} value={score}>Score {score}+</option>
            ))}
          </select>
        </div>

        {/* Кнопка сортировки */}
        <button 
          type="button"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" strokeWidth={1.5} /> : <SortAsc className="w-4 h-4" strokeWidth={1.5} />}
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* СПИСОК КАРТОЧЕК */}
      <div className="space-y-4">
        {filteredChecks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md p-6">
            <EmptyState message="No essays found matching your criteria." />
          </div>
        ) : (
          filteredChecks.map((check) => {
            const isTask1 = (check.type || 'TASK_2') === 'TASK_1';
            const prompt = typeof check.promptText === 'string' ? check.promptText.trim() : '';
            let criteriaScores = null;
            try {
              const fb = typeof check.feedback === 'string' ? JSON.parse(check.feedback) : check.feedback || {};
              const c = fb.criteria || {};
              const taskKey = isTask1 ? 'Task_Achievement' : 'Task_Response';
              if (c[taskKey] || c.Coherence_and_Cohesion || c.Lexical_Resource || c.Grammatical_Range_and_Accuracy) {
                criteriaScores = {
                  ta: c[taskKey]?.score,
                  cc: c.Coherence_and_Cohesion?.score,
                  lr: c.Lexical_Resource?.score,
                  gra: c.Grammatical_Range_and_Accuracy?.score,
                };
              }
            } catch (_) {}
            return (
              <div
                key={check.id}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/20 dark:border-slate-700/50 hover:shadow-2xl hover:border-red-500/40 transition-all active:scale-[0.99]"
              >
                <Link href={`/history/${check.id}`} className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className={`p-3 sm:p-4 rounded-2xl shrink-0 transition-colors ${isTask1 ? 'bg-slate-100/80 dark:bg-slate-800 group-hover:bg-indigo-500' : 'bg-slate-100/80 dark:bg-slate-800 group-hover:bg-red-500'} group-hover:text-white`}>
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase mb-1.5 ${isTask1 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isTask1 ? 'TASK 1' : 'TASK 2'}
                    </span>
                    <h3 className="font-black text-slate-900 dark:text-white break-words line-clamp-2">
                      {prompt || check.content}
                    </h3>
                    {prompt && (
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        <span className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400 mr-2">Answer</span>
                        {check.content}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 font-black uppercase italic mt-1 flex items-center gap-1 flex-wrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      {format(new Date(check.createdAt), "MMM dd, yyyy • HH:mm")}
                    </p>
                    {criteriaScores && (
                      <p className="text-[9px] text-slate-500 mt-1.5 font-black uppercase break-all">
                        TA {criteriaScores.ta != null ? criteriaScores.ta.toFixed(1) : '—'} · CC {criteriaScores.cc != null ? criteriaScores.cc.toFixed(1) : '—'} · LR {criteriaScores.lr != null ? criteriaScores.lr.toFixed(1) : '—'} · GRA {criteriaScores.gra != null ? criteriaScores.gra.toFixed(1) : '—'}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t border-slate-200/20 dark:border-slate-700/50 pt-4 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1 text-red-500 font-black text-xl sm:text-2xl italic tracking-tighter">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      {check.score != null ? Number(check.score).toFixed(1) : "—"}
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-500 italic">Band</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, check)}
                      disabled={downloadingId === check.id}
                      className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase transition-all disabled:opacity-50"
                      title="DOWNLOAD PDF STRATA"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">{downloadingId === check.id ? '…' : 'Report'}</span>
                    </button>
                    <Link href={`/history/${check.id}`} className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" aria-label="Open check">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
