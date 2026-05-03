import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isTransientDbError(e) {
  const msg = String(e?.message ?? e);
  return /ECHECKOUTTIMEOUT|P2024|timeout|pool|ECONNRESET|ECONNREFUSED|ENOTFOUND/i.test(
    msg
  );
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw = body?.email;
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const prisma = getPrisma();
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            password: true,
            accounts: {
              select: { provider: true },
            },
          },
        });

        if (!user) {
          return NextResponse.json({ exists: false, hasPassword: false, hasGoogle: false });
        }

        const providers = (user.accounts || []).map((a) => a.provider).filter(Boolean);
        const hasGoogle = providers.includes("google");
        const hasPassword = Boolean(user.password && String(user.password).trim().length > 0);

        return NextResponse.json({ exists: true, hasPassword, hasGoogle });
      } catch (e) {
        if (attempt === 0 && isTransientDbError(e)) {
          await sleep(450);
          continue;
        }
        throw e;
      }
    }
  } catch (e) {
    console.error("[auth] credentials-status error:", e?.message ?? e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

