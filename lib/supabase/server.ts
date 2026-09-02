import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Request-scoped Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads/writes the session from the request cookies, so all
 * queries execute under row-level security as the signed-in user.
 *
 * `cookies()` is read-only inside Server Components; the `setAll` catch there is
 * expected and harmless because `middleware.ts` is responsible for writing
 * refreshed session cookies back to the browser.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component — ignore. middleware.ts refreshes
            // the session cookie on every request.
          }
        },
      },
    },
  )
}
