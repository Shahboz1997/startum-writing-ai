'use client';
import { Search, Star, ArrowDown, ArrowUp } from 'lucide-react';

export default function HistoryFilters({ onFilterChange, filters }) {
  return (
    <div className="flex flex-wrap gap-4 mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      
      {/* Поиск по тексту */}
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
        <input 
          type="text"
          placeholder="Search by content..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-red-600 font-bold text-xs uppercase"
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Фильтр по баллу */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <Star className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
        <select 
          className="bg-transparent outline-none font-black text-[10px] uppercase cursor-pointer"
          onChange={(e) => onFilterChange('minScore', e.target.value)}
        >
          <option value="0">Min Score</option>
          {[5, 6, 7, 8, 9].map(num => (
            <option key={num} value={num}>{num}.0+</option>
          ))}
        </select>
      </div>

      {/* Сортировка по дате */}
      <button 
        onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
        className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
      >
        {filters.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> : <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />}
        Date {filters.sortOrder === 'desc' ? 'Newest' : 'Oldest'}
      </button>
    </div>
  );
}
