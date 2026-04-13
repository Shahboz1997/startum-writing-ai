import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

const root = process.cwd();
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

let url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

const isCiLike =
  process.env.VERCEL === "1" ||
  process.env.CI === "true" ||
  process.env.CI === "1";

if (!url) {
  // `prisma generate` does not connect to the DB. Vercel/GitHub often have no `.env.local`;
  // Preview may omit DATABASE_URL until it is added in the dashboard.
  if (isCiLike) {
    url =
      "postgresql://prisma_build_placeholder:prisma_build_placeholder@127.0.0.1:5432/prisma_build?schema=public";
  } else {
    throw new Error(
      "Prisma: set DATABASE_URL in .env.local. Get it from Supabase: Project Settings > Database > Connection string (URI). Use the 'Transaction' pooler URI for DATABASE_URL."
    );
  }
} else {
  // Direct Supabase host (db.xxx.supabase.co:5432) often causes P1001 from local/dev. Use pooler URI instead.
  if (url.includes("db.") && url.includes(".supabase.co:5432")) {
    throw new Error(
      "Prisma: Use the Supabase POOLER (Transaction) connection string, not the direct one. In Supabase: Project Settings > Database > Connection string > choose 'Transaction' mode and copy the URI (port 6543, host like aws-0-REGION.pooler.supabase.com). Replace DATABASE_URL in .env.local with that URI."
    );
  }
  // Use explicit sslmode=verify-full to avoid pg v9 / pg-connection-string v3 warning
  // (prefer/require/verify-ca will change semantics; explicit verify-full keeps current behavior)
  url = url.replace(/\bsslmode=(?:prefer|require|verify-ca)\b/i, "sslmode=verify-full");
}

export default defineConfig({
  datasource: {
    // Use DIRECT_URL for migrations (direct connection, not pooler)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url,
  },
});
