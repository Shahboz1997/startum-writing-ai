"use client";

import { UserCircle, Mail, Bell, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const TZ_OPTIONS = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tashkent",
  "Asia/Dubai",
  "Asia/Shanghai",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const WEEKDAYS = [
  { v: 0, en: "Sun", ru: "Вс" },
  { v: 1, en: "Mon", ru: "Пн" },
  { v: 2, en: "Tue", ru: "Вт" },
  { v: 3, en: "Wed", ru: "Ср" },
  { v: 4, en: "Thu", ru: "Чт" },
  { v: 5, en: "Fri", ru: "Пт" },
  { v: 6, en: "Sat", ru: "Сб" },
];

function parseDaysString(s) {
  if (typeof s !== "string" || !s.trim()) return [1, 2, 3, 4, 5];
  return s
    .split(",")
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
}

export default function SettingsClient({ user, reminders }) {
  const isRu = user?.language === "ru";
  const [enabled, setEnabled] = useState(Boolean(reminders?.practiceRemindersEnabled));
  const [hour, setHour] = useState(reminders?.practiceReminderHour ?? 19);
  const [minute, setMinute] = useState(reminders?.practiceReminderMinute ?? 0);
  const [tz, setTz] = useState(reminders?.practiceReminderTimezone || "UTC");
  const [days, setDays] = useState(() => new Set(parseDaysString(reminders?.practiceReminderDays)));
  const [saving, setSaving] = useState(false);

  const tzSelectOptions = useMemo(() => {
    const base = [...TZ_OPTIONS];
    if (tz && !base.includes(tz)) return [tz, ...base];
    return base;
  }, [tz]);

  const timeStr = useMemo(() => {
    const h = String(hour).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    return `${h}:${m}`;
  }, [hour, minute]);

  const setTimeFromInput = (e) => {
    const v = e.target.value;
    if (!v || !/^\d{2}:\d{2}$/.test(v)) return;
    const [hs, ms] = v.split(":");
    const h = parseInt(hs, 10);
    const m = parseInt(ms, 10);
    if (!Number.isNaN(h) && h >= 0 && h <= 23) setHour(h);
    if (!Number.isNaN(m) && m >= 0 && m <= 59) setMinute(m);
  };

  const toggleDay = (v) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      if (next.size === 0) next.add(v);
      return next;
    });
  };

  const saveReminders = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/reminder-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceRemindersEnabled: enabled,
          practiceReminderHour: hour,
          practiceReminderMinute: minute,
          practiceReminderTimezone: tz,
          practiceReminderDays: Array.from(days).sort((a, b) => a - b),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      toast.success(isRu ? "Сохранено" : "Saved");
    } catch (err) {
      toast.error(err?.message || (isRu ? "Ошибка сохранения" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Profile
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className="w-14 h-14 rounded-full border-2 border-indigo-600/30 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
              <UserCircle className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {user?.name ?? "—"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 break-all">
              <Mail className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {user?.email ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400">
            {isRu ? "Напоминания о практике (email)" : "Practice reminders (email)"}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {isRu
            ? "Нужны CRON_SECRET и EMAIL_USER / EMAIL_PASS на сервере. Cron: каждые 15 минут."
            : "Requires CRON_SECRET and EMAIL_USER / EMAIL_PASS on the server. Cron runs every 15 minutes."}
        </p>

        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-800 dark:text-slate-200">
            {isRu ? "Включить напоминания" : "Enable reminders"}
          </span>
        </label>

        <div className="space-y-3 mb-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {isRu ? "Время (локальное)" : "Local time"}
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={setTimeFromInput}
            className="w-full max-w-[12rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 mb-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {isRu ? "Часовой пояс" : "Timezone"}
          </label>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          >
            {tzSelectOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            {isRu ? "Дни (0 = вс, 1 = пн … 6 = сб)" : "Days (0 = Sun … 6 = Sat)"}
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => toggleDay(d.v)}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-medium border transition-colors ${
                  days.has(d.v)
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isRu ? d.ru : d.en}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={saveReminders}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isRu ? "Сохранить напоминания" : "Save reminders"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Account
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm break-words">
          {isRu
            ? "Тема оформления — переключатель Sun/Moon в шапке."
            : "Theme: use the Sun/Moon toggle in the navigation bar."}
        </p>
      </section>
    </div>
  );
}
