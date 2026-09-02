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
