import { auth } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="py-8">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
        Overview
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Welcome back, {session.user.name ?? session.user.email ?? "User"}.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/"
          className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-1">Writer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Go to the essay writer and analyzer</p>
        </Link>
        <Link
          href="/history"
          className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-1">My Checks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View your past essay checks</p>
        </Link>
        <Link
          href="/study-plan"
          className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors sm:col-span-2 lg:col-span-1"
        >
          <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-1">Study plan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Weak areas, charts, and resource links</p>
        </Link>
      </div>
    </div>
  );
}
