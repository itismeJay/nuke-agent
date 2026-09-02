/**
 * Canonical-skill name normalization.
 *
 * The `skill` table is a shared catalog keyed by `slug`. When a user types a
 * skill name we slugify it and upsert on the slug, so "React", "react" and
 * " React " all resolve to one catalog row.
 *
 * `slugifySkill` MUST stay in sync with the slug expression in
 * `supabase/migrations/20260903031000_career_profile_schema.sql` — the seed
 * relies on producing identical slugs.
 */

/** Trim + collapse internal whitespace; the display form stored in `skill.name`. */
export function normalizeSkillName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim()
}

/**
 * Lowercase slug. `+` → `p` and `#` → `sharp` first, so "C++" and "C#" do not
 * both collapse onto "c". Everything else non-alphanumeric becomes a single
 * dash; leading/trailing dashes are removed.
 */
export function slugifySkill(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\+/g, "p")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
