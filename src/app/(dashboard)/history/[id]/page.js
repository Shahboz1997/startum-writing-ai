import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AnalyticalLabClient from "./AnalyticalLabClient";

export default async function HistoryDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) notFound();

  let check = null;
  try {
    const prisma = getPrisma();
    const query = prisma.check.findFirst({
      where: { id, userId: session.user.id },
    });
    check = await Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out")), 12000)
      ),
    ]);
  } catch (err) {
    console.error("History detail DB error:", err);
    notFound();
  }
  if (!check) notFound();

  return <AnalyticalLabClient check={check} />;
}
