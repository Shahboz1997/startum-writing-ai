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
  // Note: DIRECT_URL is expected to be the direct host (e.g. db.<ref>.supabase.co:5432) for migrations.
}

export default defineConfig({
  datasource: {
    // Use DIRECT_URL for migrations (direct connection, not pooler)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url,
  },
});
