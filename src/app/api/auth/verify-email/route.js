import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/emailVerification";
import { ensureAuthPublicUrl } from "@/lib/ensureAuthPublicUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectBase(request) {
  ensureAuthPublicUrl();
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    request.nextUrl.origin
  ).replace(/\/+$/, "");
}

export async function GET(request) {
  const rawToken = request.nextUrl.searchParams.get("token");
  const base = redirectBase(request);

  if (!rawToken) {
    return NextResponse.redirect(`${base}/auth/verify-email?error=missing`);
  }

  const result = await verifyEmailToken(rawToken);
  if (result.ok) {
    // Writer shell + one-time loginToken for auto sign-in (no password re-entry).
    const qs = new URLSearchParams({ app: "1", emailVerified: "1" });
    if (result.loginToken) qs.set("loginToken", result.loginToken);
    return NextResponse.redirect(`${base}/?${qs.toString()}`);
  }

  return NextResponse.redirect(
    `${base}/auth/verify-email?error=${encodeURIComponent(result.error || "invalid")}`
  );
}
