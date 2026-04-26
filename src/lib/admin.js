/**
 * Admin allowlist from env: ADMIN_EMAILS=email1@x.com,email2@y.com
 * (commas, semicolons, or whitespace as separators; case-insensitive.)
 */
export function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (typeof email !== "string" || !email.trim()) return false;
  const normalized = email.trim().toLowerCase();
  const admins = parseAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(normalized);
}
