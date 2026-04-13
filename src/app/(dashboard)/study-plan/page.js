import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { getCachedWritingProfile } from "@/lib/writingProfileCache";
import { buildWritingProfile } from "@/lib/writingProfileAnalytics";
import StudyPlanClient from "@/components/dashboard/StudyPlanClient";

export default async function StudyPlanPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let locale = "en";
  let dbError = null;
  let profile = null;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    });
    locale = user?.language === "ru" ? "ru" : "en";
    profile = await getCachedWritingProfile(session.user.id, locale);
  } catch (err) {
    console.error("Study plan DB error:", err);
    dbError = err?.message || "Database unavailable";
    profile = buildWritingProfile([], { locale });
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-0 py-4 sm:py-6 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
        {locale === "ru" ? "План и аналитика" : "Study plan & analytics"}
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-8">
        {locale === "ru"
          ? `На основе ${profile.checkCount} сохранённых проверок.`
          : `Based on ${profile.checkCount} saved checks.`}
      </p>
      {dbError && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          {locale === "ru" ? "Не удалось загрузить данные: " : "Could not load data: "}
          {dbError}
        </div>
      )}
      <StudyPlanClient profile={profile} locale={locale} />
    </div>
  );
}
