import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { publicEnv, serverEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Service-role Supabase client. **Bypasses row-level security.**
 *
 * Allowed callers — trusted, server-only background operations that legitimately
 * act across tenants:
 *   - (none yet)
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
