import { Suspense } from "react";
import AuthErrorClient from "./AuthErrorClient";

function humanizeAuthError(code) {
  const c = String(code || "").trim();
  if (!c) return "Unknown auth error";
  // Auth.js common codes
  if (c === "Configuration") {
    return "Auth configuration error. This usually means missing/incorrect environment variables (AUTH_URL/NEXTAUTH_URL, AUTH_SECRET/NEXTAUTH_SECRET, Google credentials) or a host/redirect mismatch.";
  }
  if (c === "OAuthSignin" || c === "OAuthCallback") {
    return "OAuth sign-in failed. Check Google OAuth redirect URI and AUTH_URL/NEXTAUTH_URL.";
  }
  if (c === "OAuthAccountNotLinked") {
    return "This email is already registered with a different sign-in method. Use the same method you used originally.";
  }
  if (c === "AccessDenied") {
    return "Access denied by the provider or your app.";
  }
  if (c === "Verification") {
    return "Verification failed or expired.";
  }
  return `Auth error: ${c}`;
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorClient humanizeAuthError={humanizeAuthError} />}>
      <AuthErrorClient humanizeAuthError={humanizeAuthError} />
    </Suspense>
  );
}

