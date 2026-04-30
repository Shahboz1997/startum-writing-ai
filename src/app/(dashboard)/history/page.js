import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import HistoryClientWrapper from "@/components/dashboard/HistoryClientWrapper";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let initialChecks = [];
  let dbError = null;
  try {
    const prisma = getPrisma();
    // History list can get heavy fast (content + JSON feedback). Keep it snappy and avoid dev "cold DB" flakiness.
    const TAKE = 75;
    const DB_TIMEOUT_MS = 25_000;
    const query = prisma.check.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        content: true,
        promptText: true,
        score: true,
        createdAt: true,
        type: true,
        feedback: true,
      },
    });

    initialChecks = await Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out")), DB_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.error("History DB error:", err);
    dbError = err?.message || "Database unavailable";
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-0 py-4 sm:py-6 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 md:mb-8">
        My Archive
      </h1>
      {dbError && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          Cannot load archive: {dbError}. Check DATABASE_URL in .env.local and that your database (e.g. Supabase) is running and reachable.
        </div>
      )}
      <HistoryClientWrapper initialData={initialChecks} />
    </div>
  );
}
