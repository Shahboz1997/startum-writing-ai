import dns from "node:dns";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

function isSupabaseCloudHost(url) {
  return /supabase\.(com|co)\b/i.test(String(url ?? ""));
}

/**
 * Prefer IPv4 for DB connections when:
 * - explicit PG_IPV4_FIRST=1, or Windows dev (IPv6 hangs on some LANs), or
 * - Vercel + Supabase (intermittent IPv6 / routing → RST / ERR_CONNECTION_CLOSED during cold OAuth).
 */
function preferIpv4ForDatabase(connectionString) {
  if (process.env.PG_IPV4_FIRST === "0") return false;
  if (process.env.PG_IPV4_FIRST === "1") return true;
  if (process.platform === "win32") return true;
  if (
    process.env.VERCEL === "1" &&
    connectionString &&
    isSupabaseCloudHost(connectionString)
  ) {
    return true;
  }
  return false;
}

const earlyDbUrl = (
  process.env.PRISMA_RUNTIME_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  ""
).trim();

if (typeof dns.setDefaultResultOrder === "function" && preferIpv4ForDatabase(earlyDbUrl)) {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Supabase **Transaction** pooler (port 6543 / *.pooler.supabase.com) + Prisma: add `pgbouncer=true`
 * if missing (see Supabase “Connect to Postgres” → Prisma). Avoid **Session** pooler for Prisma app traffic.
 */
function normalizeSupabasePooledUrl(url) {
  if (!url || !isSupabaseCloudHost(url)) return url;
  const looksLikeTxnPooler =
    /:\s*6543\b/i.test(url) ||
    /\.pooler\.supabase\.com/i.test(url) ||
    /pooler\.supabase\.com/i.test(url);
  if (looksLikeTxnPooler && !/[?&]pgbouncer=true\b/i.test(url)) {
    return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`;
  }
  return url;
}

/**
 * If the URI has no `/dbname` before the query string, libpq/pg defaults the database name
 * to the username. Supabase pooler usernames are `postgres.<project-ref>` → bogus DB
 * `postgres.xxx` and error 3D000. Always use database `postgres` when path is omitted.
 */
function ensureSupabaseDefaultDatabase(connectionString) {
  if (!connectionString || !isSupabaseCloudHost(connectionString)) {
    return connectionString;
  }
  try {
    const u = new URL(connectionString);
    const db = (u.pathname || "").replace(/^\//, "").split("/")[0];
    if (db) return connectionString;
    u.pathname = "/postgres";
    return u.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Recent pg / pg-connection-string versions may treat sslmode=require/prefer/verify-ca as aliases for verify-full,
 * which breaks Supabase/Neon chains on many dev machines (self-signed / missing intermediate CA).
 * Opt into libpq-compatible semantics when the URL explicitly requests sslmode=require.
 */
function ensureLibpqCompatSslMode(connectionString) {
  if (!connectionString) return connectionString;
  // Only adjust when sslmode is explicitly set to a "non-verify-full" value.
  if (!/\bsslmode=(?:require|prefer|verify-ca)\b/i.test(connectionString)) return connectionString;
  if (/\buselibpqcompat=true\b/i.test(connectionString)) return connectionString;
  return connectionString.includes("?")
    ? `${connectionString}&uselibpqcompat=true`
    : `${connectionString}?uselibpqcompat=true`;
}

function createPgPool() {
  // PRISMA_RUNTIME_DATABASE_URL overrides everything (e.g. force transaction pooler only).
  // Supabase: use DATABASE_URL = **Transaction** pooler URI for the app; DIRECT_URL = direct (migrations).
  // Prefer DATABASE_URL before DIRECT_URL so PrismaAdapter does not saturate the small direct pool.
  let connectionString =
    (process.env.PRISMA_RUNTIME_DATABASE_URL || "").trim() ||
    (process.env.DATABASE_URL || "").trim() ||
    (process.env.DIRECT_URL || "").trim();
  connectionString = normalizeSupabasePooledUrl(connectionString);
  connectionString = ensureSupabaseDefaultDatabase(connectionString);
  connectionString = ensureLibpqCompatSslMode(connectionString);
  const isTcpLocal = /localhost|127\.0\.0\.1|@127\.0\.0\.1|@localhost/i.test(
    connectionString || ""
  );

  // verify-full in production for generic Postgres; skip for Supabase hosts — upgrading sslmode here combined with
  // Pool TLS options caused intermittent handshake failures / dropped connections on some hosted setups (OAuth callbacks).
  if (
    !isTcpLocal &&
    connectionString &&
    process.env.NODE_ENV === "production" &&
    !isSupabaseCloudHost(connectionString)
  ) {
    connectionString = connectionString.replace(
      /\bsslmode=(?:prefer|require|verify-ca)\b/i,
      "sslmode=verify-full"
    );
  }

  /** PgBouncer / Supabase pooler: avoid passing custom startup GUCs via Pool `options` (can drop connections). */
  function poolSsl(cs) {
    if (!cs || isTcpLocal) return undefined;
    if (/\bsslmode=verify-full\b/i.test(cs)) return { rejectUnauthorized: true };
    if (/\bsslmode=/i.test(cs)) return { rejectUnauthorized: false };
    if (
      /neon\.tech|supabase\.(com|co)\b|pooler\.|\.pooler\.|amazonaws\.com|rds\.amazonaws\.com/i.test(
        cs
      )
    ) {
      return { rejectUnauthorized: false };
    }
    return undefined;
  }

  // OAuth + PrismaAdapter: allow cold Supabase / TLS; too low → timeouts on first connect.
  const ms = 60000;
  const defaultPoolMax = isSupabaseCloudHost(connectionString) ? 5 : 10;
  const max = Math.min(
    50,
    Math.max(
      1,
      Number.parseInt(process.env.PG_POOL_MAX || String(defaultPoolMax), 10) ||
        defaultPoolMax
    )
  );

  const preferIpv4 = !isTcpLocal && preferIpv4ForDatabase(connectionString);

  return new Pool({
    connectionString,
    ssl: poolSsl(connectionString),
    max,
    ...(preferIpv4 ? { family: 4 } : {}),
    // Default pg-pool idle reap (10s) + PrismaPg can drop all clients when idle → reconnect storms / checkout timeouts.
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: ms,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPgPool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

