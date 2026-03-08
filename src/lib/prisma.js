import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

function createPgPool() {
  // Use DIRECT_URL for Prisma + pg adapter to avoid pooler limitations
  // (e.g. compound findUnique can fail through pooler). Fallback to DATABASE_URL.
  // Ensure the URL in .env.local is correct and reachable (VPN/network).
  let connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL;
  // Explicit sslmode=verify-full avoids pg v9 / pg-connection-string v3 security warning
  connectionString = connectionString?.replace(
    /\bsslmode=(?:prefer|require|verify-ca)\b/i,
    "sslmode=verify-full"
  ) ?? connectionString;
  const ssl = connectionString?.includes('sslmode=')
    ? connectionString.includes('sslmode=verify-full')
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false }
    : undefined;

  return new Pool({
    connectionString,
    ssl,
    connectionTimeoutMillis: 15000,
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

