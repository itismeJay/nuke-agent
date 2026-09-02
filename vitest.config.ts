import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Unit-test layer only. Pure/deterministic domain logic — no DOM, no network,
// no Supabase. Component, integration, and RLS tests are separate layers added
// later (see docs/project/CICD.md → Test Strategy).
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // Mirror the `@/*` -> repo-root alias from tsconfig.json so tests can import
    // the same way app code does.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
})
