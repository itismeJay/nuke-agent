/**
 * Maps raw Supabase auth error messages to safe, user-facing copy.
 *
 * Two rules this protects:
 *  - never surface a raw provider/database string to the client, and
 *  - never let the copy reveal whether an email address has an account
 *    (account enumeration) — an unknown error and a wrong password both fall
 *    through to the same generic message.
 */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) {
    return "That email or password is incorrect."
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with that email already exists. Try signing in."
  }
  if (m.includes("email rate limit") || m.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again."
  }
  if (m.includes("weak password")) {
    return "That password is too weak. Try a longer one."
  }
  return "Something went wrong. Please try again."
}

/**
 * Auth redirects (OAuth start failures, the `/auth/callback` handler) hand the
 * sign-in page an `?error=<code>` rather than free text, so the page never
 * reflects an attacker-controlled string into its error banner. Unknown or
 * missing codes render nothing.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_start: "Could not start Google sign-in. Please try again.",
  oauth_failed: "That sign-in was cancelled or did not complete.",
  link_invalid: "That sign-in link is invalid.",
  link_expired: "That link has expired. Request a new one.",
}

export function authErrorMessage(
  code: string | string[] | null | undefined,
): string | null {
  const key = Array.isArray(code) ? code[0] : code
  if (!key) return null
  return AUTH_ERROR_MESSAGES[key] ?? null
}
