import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Database / tenant-isolation layer. Runs SQL assertions against a real
// Postgres — the local Supabase stack (`supabase start`) or the CI stack.
// Kept separate from the unit layer (`vitest.config.ts`) so `npm test` stays
// fast and offline. Run with `npm run test:db`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    // One shared Postgres connection; parallel files would fight over roles.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
})
