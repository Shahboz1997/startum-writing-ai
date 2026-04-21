// Dashboard layout — Cathalon.ai–style: deep slate/black dark, crisp off-white light, slim sidebar alignment
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardContentWrapper from "@/components/dashboard/DashboardContentWrapper";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div
      className="flex min-h-[100dvh] bg-[#F9FAFB] dark:bg-[#050505] transition-all duration-500 ease-in-out overflow-x-hidden"
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <Sidebar user={session.user} credits={session.user?.credits ?? 0} />

      <main
        className="flex-1 overflow-y-auto min-h-0
          px-4 sm:pl-60 sm:pr-6 lg:pr-8
          pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:pb-8
          border-t border-white/5
          bg-gradient-to-b from-slate-50/80 to-[#F9FAFB] dark:from-slate-950/80 dark:to-[#050505]
          transition-all duration-500 ease-in-out"
      >
        <div className="h-full tracking-tight">
          <DashboardContentWrapper>{children}</DashboardContentWrapper>
        </div>
      </main>
    </div>
  );
}
