import util from "node:util";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { formatAuthErrorCause } from "@/lib/formatAuthErrorCause";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/** Wakes Postgres (Supabase pool) / first pg pool connection before OAuth (reduces cold stalls). */
export async function GET() {
  const t0 = Date.now();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ms: Date.now() - t0 });
  } catch (e) {
    const chain = formatAuthErrorCause(e);
    console.error("[warm-db] failed:", chain || String(e?.message ?? e));
    if (isDev) {
      console.error(
        "[warm-db] inspect:",
        util.inspect(e, { depth: 10, colors: false, breakLength: 120 })
      );
    }
    const payload = {
      ok: false,
      ms: Date.now() - t0,
      error: String(e?.message ?? e),
      cause: chain || undefined,
      hint:
        "Supabase: DATABASE_URL must be the **Transaction** pooler URI (port 6543, pgbouncer=true — we append it if missing). DIRECT_URL = direct for migrations only. ECHECKOUTTIMEOUT Session mode → you used **Session** pooler or saturated direct DB; switch pool mode in Supabase or lower PG_POOL_MAX. Restart dev after .env changes. Windows IPv6: PG_IPV4_FIRST=0 disables ipv4first.",
    };
    return NextResponse.json(payload, { status: 503 });
  }
}
