export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getPrisma } from "@/lib/prisma";
import { createShareToken } from "@/lib/shareToken";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function toUsernameHandle(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[@\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.length >= 3 ? s.slice(0, 20) : "";
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const t1Id = typeof body?.t1Id === "string" ? body.t1Id.trim() : "";
  const t2Id = typeof body?.t2Id === "string" ? body.t2Id.trim() : "";

  const ids = [t1Id, t2Id].filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Missing check id(s)" }, { status: 400 });
  }

  const prisma = getPrisma();
  const checks = await prisma.check.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    select: { id: true, type: true },
  });

  // Ensure the user can only share their own checks.
  const found = new Set(checks.map((c) => c.id));
  for (const id of ids) {
    if (!found.has(id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = Date.now();
  const emailPrefix = String(session?.user?.email || "").split("@")[0] || "";
  const ref =
    toUsernameHandle(session?.user?.username) ||
    toUsernameHandle(session?.user?.name) ||
    toUsernameHandle(emailPrefix) ||
    null;

  const token = createShareToken({
    v: 1,
    t1Id: t1Id || null,
    t2Id: t2Id || null,
    ref,
    iat: now,
    exp: now + THIRTY_DAYS_MS,
  });

  return NextResponse.json({ ok: true, token }, { status: 200 });
}

