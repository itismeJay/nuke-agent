import "server-only"

import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

/** The authenticated user, or null. Validates the JWT with the auth server. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Require an authenticated user in a Server Component / layout. Redirects to
 * sign-in if absent. `middleware.ts` already guards protected route groups; this
 * is defence-in-depth and gives components a typed non-null user.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    const target = redirectTo
      ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/sign-in"
    redirect(target)
  }
  return user
}
