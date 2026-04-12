'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BookOpen, Bell, TrendingDown, ExternalLink } from 'lucide-react';

const BAR_CRIT = '#6366f1';
const BAR_ERR = '#f43f5e';

export default function StudyPlanClient({ profile, locale }) {
  const isRu = locale === 'ru';
  const critData = (profile.criteriaSeries || []).map((r) => ({
    ...r,
    display: r.value != null ? Number(r.value.toFixed(2)) : null,
  }));
  const errData = (profile.errorSeries || []).filter((e) => e.count > 0);

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
        <div className="flex items-start gap-3 mb-2">
          <TrendingDown className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              {isRu ? 'Ваш фокус' : 'Your focus'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {profile.headline}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              {profile.plan}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">
          {isRu ? 'Средние баллы по критериям' : 'Average criterion bands'}
        </h2>
        {critData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRu
              ? 'Нет сохранённых оценок по критериям. Отправьте эссе на проверку — данные появятся здесь.'
              : 'No criterion scores yet. Submit an essay check to see averages here.'}
          </p>
        ) : (
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={critData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" horizontal={false} />
                <XAxis type="number" domain={[0, 9]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v, _name, item) => {
                    const n = item?.payload?.n;
                    const suffix = n != null ? ` (n=${n})` : '';
                    return [`${v}${suffix}`, isRu ? 'Среднее' : 'Avg'];
                  }}
                />
                <Bar dataKey="display" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {critData.map((_, i) => (
                    <Cell key={i} fill={BAR_CRIT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
          {isRu ? 'Ошибки по типам (все проверки)' : 'Flagged issues by type (all checks)'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {isRu
            ? 'Сводка по полям errors / corrections в отчётах AI. Не все проблемы могут быть размечены.'
            : 'Aggregated from AI report fields (errors / corrections). Not every issue may be tagged.'}
        </p>
        {errData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRu
              ? 'Пока нет размеченных ошибок — или отчёты без списка issues.'
              : 'No tagged issues yet, or reports without an error list.'}
          </p>
        ) : (
          <div className="h-52 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [v, isRu ? 'Кол-во' : 'Count']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {errData.map((_, i) => (
                    <Cell key={i} fill={BAR_ERR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            {isRu ? 'Материалы под слабые места' : 'Materials for weak areas'}
          </h2>
        </div>
        {profile.recommendations?.length ? (
          <ul className="space-y-3">
            {profile.recommendations.map((r, i) => (
              <li key={`${r.url}-${i}`}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.title}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" strokeWidth={1.5} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRu ? 'Добавьте проверки — появятся ссылки.' : 'Add checks to see suggested links.'}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-950/40 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
              {isRu ? 'Напоминания о тренировках' : 'Practice reminders'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {isRu
                ? 'Пуш-уведомления и email можно подключить позже (очередь задач + настройки в профиле). Пока используйте напоминание в календаре телефона на 2–3 сеанса в неделю.'
                : 'Push and email reminders can be added later (job queue + user settings). For now, use your phone calendar for 2–3 weekly sessions.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
