import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import { ensureAccountInitialized } from "@/lib/auth/account"
import type { Database } from "@/lib/supabase/database.types"

type DB = SupabaseClient<Database>
type OwnerUser = Pick<User, "id" | "email" | "user_metadata">

/**
 * The caller's own `profile.id`.
 *
 * Every Career Profile child row references `(profile_id, user_id)` — the
 * `profile_id` is resolved here from the session and is NEVER accepted from the
 * client. Seeds the base rows if the signup trigger somehow missed this account
 * (same fallback as `app/(app)/layout.tsx`).
 */
export async function resolveOwnProfileId(
  supabase: DB,
  user: OwnerUser,
): Promise<string> {
  const first = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (first.data) return first.data.id

  await ensureAccountInitialized(supabase, user)

  const second = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!second.data) {
    throw new Error("Could not initialize a profile for the current user.")
  }
  return second.data.id
}
