import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { issueVerificationEmailForUser } from "@/lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await getPrisma().user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true, password: true },
    });

    // Do not reveal whether the account exists.
    if (!user || !user.password || user.emailVerified) {
      return NextResponse.json({
        ok: true,
        message: "If an unverified account exists, a new confirmation email was sent.",
      });
    }

    const sent = await issueVerificationEmailForUser(user);
    if (!sent.ok && (sent.reason === "no_smtp" || sent.reason === "no_mail" || sent.reason === "no_resend")) {
      return NextResponse.json(
        { error: "Email service is not configured. Try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If an unverified account exists, a new confirmation email was sent.",
      emailSent: sent.ok,
    });
  } catch (e) {
    console.error("[auth/resend-verification]", e?.message ?? e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
