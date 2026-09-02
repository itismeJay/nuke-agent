import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Application-side safety net for account initialization.
 *
 * The `handle_new_user` database trigger is the primary mechanism: it seeds the
 * required `profile` and `agent_settings` rows when `auth.users` gets a row.
 * This function re-asserts that contract from the app in case the trigger was
 * added after a user existed, or a previous attempt partially failed.
 *
 * Idempotent: uses `upsert(..., { onConflict: "user_id", ignoreDuplicates: true })`
 * so repeated calls and races are safe. Runs under RLS as `user` — the "own rows"
 * policy permits inserting rows where `user_id = auth.uid()`.
 *
 * Returns `{ ok: true }` on success, or `{ ok: false, error }` — callers should
 * not hard-fail the request on a transient error; the trigger has usually
 * already done the work.
 */
export async function ensureAccountInitialized(
  supabase: SupabaseClient<Database>,
  user: Pick<User, "id" | "email" | "user_metadata">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profileResult = await supabase
    .from("profile")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    )

  if (profileResult.error) {
    return { ok: false, error: profileResult.error.message }
  }

  const settingsResult = await supabase
    .from("agent_settings")
    .upsert(
      { user_id: user.id },
      { onConflict: "user_id", ignoreDuplicates: true },
    )

  if (settingsResult.error) {
    return { ok: false, error: settingsResult.error.message }
  }

  return { ok: true }
}
