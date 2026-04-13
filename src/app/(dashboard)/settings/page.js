// Settings page — profile/account management only. No theme logic (no setTheme, no useEffect that changes theme).
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  let reminders = null;
  try {
    const prisma = getPrisma();
    reminders = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        practiceRemindersEnabled: true,
        practiceReminderHour: true,
        practiceReminderMinute: true,
        practiceReminderTimezone: true,
        practiceReminderDays: true,
      },
    });
  } catch {
    reminders = null;
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
        Account settings
      </h1>
      <SettingsClient user={session.user} reminders={reminders} />
    </div>
  );
}
