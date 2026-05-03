/**
 * Flatten Auth.js / Prisma error chains for logs (CallbackRouteError.cause, AdapterError.err, etc.).
 */
export function formatAuthErrorCause(err) {
  const parts = [];
  let e = err;
  let depth = 0;
  while (e != null && depth < 20) {
    depth += 1;
    if (e instanceof Error) {
      parts.push(`${e.name}: ${e.message}`);
      if (e.code != null) parts.push(`code=${e.code}`);
      if (e.meta != null && typeof e.meta === "object") {
        try {
          parts.push(`meta=${JSON.stringify(e.meta)}`);
        } catch {
          /* ignore */
        }
      }
      e = e.cause;
      continue;
    }
    if (typeof e === "object" && e !== null && "cause" in e && e.cause != null) {
      e = e.cause;
      continue;
    }
    if (typeof e === "object" && e !== null && "err" in e && e.err != null) {
      e = e.err;
      continue;
    }
    // Prisma driver adapter / Auth.js sometimes attach plain-object causes (not Error instances).
    if (typeof e === "object" && e !== null && !(e instanceof Error)) {
      const kind = e.kind ?? e.type;
      const msg = e.message ?? e.originalMessage ?? e.detail;
      const code = e.code ?? e.originalCode;
      if (msg != null || code != null || kind != null) {
        const bit = [kind, code, msg].filter((x) => x != null && String(x).length > 0).join(": ");
        if (bit) parts.push(bit);
        const next = e.cause ?? e.err;
        if (next != null) {
          e = next;
          continue;
        }
        break;
      }
    }
    try {
      parts.push(typeof e === "object" ? JSON.stringify(e) : String(e));
    } catch {
      parts.push(String(e));
    }
    break;
  }
  return parts.join(" → ");
}
