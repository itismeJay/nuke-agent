/** Shared normalisation helpers for extracted résumé data. */

/**
 * Turn an extracted date (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) into a full ISO date
 * for storage, padding missing parts with `01`. Returns null for anything that
 * isn't a well-formed, real calendar date.
 */
export function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = match[2] ? Number(match[2]) : 1
  const day = match[3] ? Number(match[3]) : 1
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const parsed = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  // Guard against rollover (e.g. 2020-02-31 -> March).
  if (parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    return null
  }
  return iso
}

/** Add a scheme to a bare URL so it satisfies the profile's URL validation. */
export function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`
  return null
}

/** Case/space-insensitive comparison key for free-text matching. */
export function comparisonKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Whitespace-collapsed trim; empty string becomes null. */
export function cleanText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim()
  return trimmed.length > 0 ? trimmed : null
}
