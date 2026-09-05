import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { publicEnv, serverEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Service-role Supabase client. **Bypasses row-level security.**
 *
 * Allowed callers — trusted, server-only background operations that legitimately
 * act across tenants:
 *   - `inngest/functions/parse-resume.ts` — the résumé parse workflow runs with
 *     no user session; it reads the private Storage object and writes
 *     `resume_import` / `resume_import_item` rows. Every query is scoped to the
 *     `user_id` carried in the Inngest event, and ownership of the
 *     `master_resume` row is re-checked before any work is done.
 *
 * NOT allowed:
 *   - anything reachable from a React Server/Client Component render
 *   - normal per-user request handling (use `lib/supabase/server.ts` instead —
 *     it enforces RLS as the signed-in user)
 *
 * The `server-only` import makes bundling this into client code a build error.
 * Document every new trusted caller in docs/project/CURRENT_STATE.md.
 */
export function createAdminClient() {
  const { supabaseServiceRoleKey } = serverEnv()
  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The admin client is only for " +
        "trusted background operations; add the key to .env.local when one needs it.",
    )
  }

  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
