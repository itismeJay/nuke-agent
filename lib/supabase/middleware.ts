import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { publicEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

/** Route groups that require an authenticated user. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/resumes",
  "/jobs",
  "/applications",
  "/settings",
]

/** Auth screens a signed-in user should be bounced away from. */
const AUTH_PREFIXES = ["/sign-in", "/sign-up", "/forgot-password"]

function isMatch(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/**
 * Runs on every matched request:
 *  1. refreshes the Supabase session and writes rotated cookies onto the response
 *  2. redirects signed-out users away from protected routes
 *  3. redirects signed-in users away from auth routes
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Do not run code between createServerClient and getUser() — it must be the
  // first await so the session is validated before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && isMatch(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  if (user && isMatch(pathname, AUTH_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
