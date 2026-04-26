export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { clampCreditsAdminManual } from "@/lib/credits";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!actor?.email || !isAdminEmail(actor.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const rawUserId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (rawEmail && rawUserId) {
    return NextResponse.json(
      { error: "Provide only one of email or userId" },
      { status: 400 }
    );
  }
  if (!rawEmail && !rawUserId) {
    return NextResponse.json(
      { error: "Missing target: email or userId" },
      { status: 400 }
    );
  }

  const credits = clampCreditsAdminManual(body?.credits);

  try {
    const updated = await prisma.user.update({
      where: rawUserId ? { id: rawUserId } : { email: rawEmail },
      data: { credits },
      select: { id: true, email: true, credits: true },
    });
    return NextResponse.json(
      { ok: true, user: { id: updated.id, email: updated.email, credits: updated.credits } },
      { status: 200 }
    );
  } catch (e) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[/api/admin/credits]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
