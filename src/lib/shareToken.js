import { createHmac, timingSafeEqual } from "crypto";

const isDev = process.env.NODE_ENV === "development";

function getShareSecret() {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").trim();
  if (secret.length > 0) return secret;
  if (isDev) return "dev-secret-min-32-chars-required-for-auth";
  throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be set for share links.");
}

function b64urlEncodeString(str) {
  return Buffer.from(String(str), "utf8").toString("base64url");
}

function b64urlDecodeToString(b64url) {
  return Buffer.from(String(b64url), "base64url").toString("utf8");
}

function signPayloadB64(payloadB64) {
  return createHmac("sha256", getShareSecret()).update(payloadB64).digest("base64url");
}

export function createShareToken(payload) {
  const payloadB64 = b64urlEncodeString(JSON.stringify(payload ?? {}));
  const sigB64 = signPayloadB64(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export function verifyShareToken(tokenRaw) {
  const token = String(tokenRaw || "");
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "BAD_FORMAT" };

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { ok: false, error: "BAD_FORMAT" };

  const expectedSig = signPayloadB64(payloadB64);
  try {
    const a = Buffer.from(sigB64, "base64url");
    const b = Buffer.from(expectedSig, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "BAD_SIGNATURE" };
    }
  } catch {
    return { ok: false, error: "BAD_SIGNATURE" };
  }

  let payload;
  try {
    payload = JSON.parse(b64urlDecodeToString(payloadB64));
  } catch {
    return { ok: false, error: "BAD_PAYLOAD" };
  }

  if (!payload || typeof payload !== "object") return { ok: false, error: "BAD_PAYLOAD" };
  if (payload.v !== 1) return { ok: false, error: "UNSUPPORTED_VERSION" };

  const now = Date.now();
  const exp = Number(payload.exp);
  if (Number.isFinite(exp) && exp > 0 && now > exp) {
    return { ok: false, error: "EXPIRED" };
  }

  const t1Id = typeof payload.t1Id === "string" && payload.t1Id.trim() ? payload.t1Id.trim() : null;
  const t2Id = typeof payload.t2Id === "string" && payload.t2Id.trim() ? payload.t2Id.trim() : null;
  if (!t1Id && !t2Id) return { ok: false, error: "EMPTY" };

  const ref =
    typeof payload.ref === "string" && payload.ref.trim()
      ? payload.ref.trim().slice(0, 40)
      : null;

  return { ok: true, data: { t1Id, t2Id, ref, iat: payload.iat ?? null, exp: payload.exp ?? null } };
}

