import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AnalyticalLabClient from "./AnalyticalLabClient";

function isTransientDbError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("connection terminated unexpectedly") ||
    msg.includes("server has closed the connection") ||
    msg.includes("tls") ||
    msg.includes("self-signed certificate") ||
    msg.includes("timeout") ||
    msg.includes("econnreset")
  );
}

export default async function HistoryDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) notFound();

  let check = null;
  try {
    const prisma = getPrisma();
    const DB_TIMEOUT_MS = 25_000;
    const runQuery = () =>
      prisma.check.findFirst({
        where: { id, userId: session.user.id },
      });

    async function withTimeout(promise, ms) {
      return await Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Database query timed out")), ms)
        ),
      ]);
    }

    try {
      check = await withTimeout(runQuery(), DB_TIMEOUT_MS);
    } catch (e) {
      if (isTransientDbError(e)) {
        await new Promise((r) => setTimeout(r, 350));
        check = await withTimeout(runQuery(), DB_TIMEOUT_MS);
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error("History detail DB error:", err);
    notFound();
  }
  if (!check) notFound();

  return <AnalyticalLabClient check={check} />;
}
