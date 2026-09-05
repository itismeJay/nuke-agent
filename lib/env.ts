/**
 * Centralised, validated environment access.
 *
 * Public values (NEXT_PUBLIC_*) are safe in client bundles. Secret values are
 * only read from `serverEnv()` which throws if imported/executed in the browser.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value
}

export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
}

/**
 * Secret env. Never call from client components / shared modules.
 *
 * Values are read lazily (not validated at module load) so `next build` and the
 * unit test layer run without production secrets. Callers that need a value
 * should use the `require*` helpers, which throw a clear error when it is unset.
 */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must never be called in the browser")
  }
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    // Anthropic is the intended long-term provider (D-022) but currently
    // unbilled; Gemini is a temporary swap (D-025) — see lib/ai/gemini.ts.
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    inngestEventKey: process.env.INNGEST_EVENT_KEY ?? "",
    inngestSigningKey: process.env.INNGEST_SIGNING_KEY ?? "",
  }
}

const ENV_VAR_NAMES: Record<keyof ReturnType<typeof serverEnv>, string> = {
  supabaseServiceRoleKey: "SUPABASE_SERVICE_ROLE_KEY",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  geminiApiKey: "GEMINI_API_KEY",
  inngestEventKey: "INNGEST_EVENT_KEY",
  inngestSigningKey: "INNGEST_SIGNING_KEY",
}

/** A required secret, or a thrown error naming it. */
export function requireServerEnv(
  name: keyof ReturnType<typeof serverEnv>,
): string {
  const value = serverEnv()[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${ENV_VAR_NAMES[name]}. ` +
        `Set it in .env.local (local) or the deployment environment.`,
    )
  }
  return value
}
