/**
 * Post-auth redirect safety.
 *
 * A `redirectTo` value always originates from a query string or a form field, so
 * it is fully attacker-controlled. It is only safe to navigate to when it is a
 * same-origin *relative path*. Anything that could resolve to another origin
 * (protocol-relative `//host`, backslash tricks some browsers normalise to `//`,
 * absolute URLs) must be rejected, otherwise we have an open-redirect that can be
 * used for credential-phishing hand-offs straight out of the auth flow.
 *
 * This is the single validator for that check — do not re-implement it inline.
 */

const MAX_LEN = 512

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Returns the value if it is a safe same-origin relative path, otherwise `null`.
 *
 * Accepts `unknown` because callers pass raw `FormDataEntryValue`,
 * `string | string[] | undefined` query params, etc.
 */
export function safeRelativePath(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string") return null
  if (raw.length === 0 || raw.length > MAX_LEN) return null

  // Must be an absolute-path reference: exactly one leading slash.
  if (!raw.startsWith("/")) return null
  if (raw.startsWith("//")) return null

  // `/\evil.com` — browsers can treat a backslash as `/`, making this `//evil.com`.
  if (raw.startsWith("/\\")) return null

  // Control characters (NUL, CR, LF, tab, DEL) — header/log injection, parser
  // confusion.
  if (hasControlChar(raw)) return null

  return raw
}

/**
 * Same check as {@link safeRelativePath}, but returns `fallback` instead of
 * `null` when the value is unsafe. Use when the caller must have a destination.
 */
export function safeRedirect(value: unknown, fallback = "/dashboard"): string {
  return safeRelativePath(value) ?? fallback
}
