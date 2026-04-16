import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw = body?.email;
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const prisma = getPrisma();
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
    console.error("[auth] credentials-status error:", e?.message ?? e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

