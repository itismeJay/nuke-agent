"use client"

import { createBrowserClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Browser Supabase client. Uses the publishable/anon key and the user's session
 * cookie, so every query runs under row-level security as the signed-in user.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  )
}
