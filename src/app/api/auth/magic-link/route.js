import { NextResponse } from "next/server";
import { issueMagicLinkForEmail } from "@/lib/emailVerification";
import {
  disposableEmailMessage,
  validateSignupEmail,
} from "@/lib/emailValidation";
import { isOutboundMailConfigured } from "@/lib/resendMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_OK =
  "If an account exists for that email, we sent a sign-in link. Check your inbox.";

/**
 * Passwordless sign-in: email a one-time login link.
 * Always returns a generic success message (anti-enumeration).
 */
export async function POST(request) {
  try {
    if (!isOutboundMailConfigured()) {
      return NextResponse.json(
        { error: "Email sign-in is not configured. Use password or Google." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const emailCheck = validateSignupEmail(body?.email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: disposableEmailMessage(emailCheck.reason) },
        { status: 400 }
      );
    }

    const result = await issueMagicLinkForEmail(emailCheck.email);
    if (!result.ok && result.reason === "no_mail") {
      return NextResponse.json(
        { error: "Email sign-in is not configured. Use password or Google." },
        { status: 503 }
      );
    }
    if (!result.ok && result.reason === "send_failed") {
      // Still generic — do not confirm the account exists.
      console.error("[auth/magic-link] send failed", result.reason);
    }

    return NextResponse.json({ ok: true, message: GENERIC_OK });
  } catch (e) {
    console.error("[auth/magic-link]", e?.message ?? e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
