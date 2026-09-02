import { NextResponse, type NextRequest } from "next/server"

import { ensureAccountInitialized } from "@/lib/auth/account"
import { safeRedirect } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth / email-link return endpoint. Exchanges the `code` for a session
 * (PKCE verifier is in the cookie set when the flow started), seeds base
 * account rows, then forwards to the intended destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const errorDescription = searchParams.get("error_description")

  const redirectTo = safeRedirect(searchParams.get("redirectTo"))

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/sign-in?error=oauth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=link_invalid`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=link_expired`)
  }

  if (data.user) {
    await ensureAccountInitialized(supabase, data.user)
  }

  return NextResponse.redirect(`${origin}${redirectTo}`)
}
