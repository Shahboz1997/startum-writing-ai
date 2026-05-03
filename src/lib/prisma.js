import dns from "node:dns";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

/** Hosted Postgres (Supabase, etc.) + Windows often hangs on IPv6; IPv4 avoids bad routes. */
function shouldPreferIpv4() {
  if (process.env.PG_IPV4_FIRST === "0") return false;
  if (process.env.PG_IPV4_FIRST === "1") return true;
  return process.platform === "win32";
}

if (typeof dns.setDefaultResultOrder === "function" && shouldPreferIpv4()) {
  dns.setDefaultResultOrder("ipv4first");
}

function isSupabaseCloudHost(url) {
  return /supabase\.(com|co)\b/i.test(String(url ?? ""));
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
  const isTcpLocal = /localhost|127\.0\.0\.1|@127\.0\.0\.1|@localhost/i.test(
    connectionString || ""
  );

  // verify-full only in production for remote hosts; dev keeps URL as-is (corporate TLS, Supabase dev).
  if (!isTcpLocal && connectionString && process.env.NODE_ENV === "production") {
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

  const preferIpv4 = shouldPreferIpv4() && !isTcpLocal;

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

