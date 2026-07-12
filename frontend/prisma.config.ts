import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load Vite-style env files (Supabase Prisma docs use .env.local)
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7: CLI/migrations must use session-mode pooler (DIRECT_URL),
    // not the transaction pooler (DATABASE_URL / pgbouncer).
    url: env("DIRECT_URL"),
  },
});
