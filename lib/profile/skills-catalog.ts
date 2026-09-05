import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

import { normalizeSkillName, slugifySkill } from "./skills"

type DB = SupabaseClient<Database>

/**
 * Resolve skill names to catalog ids, inserting any that are new.
 *
 * The `skill` catalog is append-only for `authenticated` (INSERT policy, no
 * UPDATE), so we insert-ignore-duplicates and then read every row back by slug.
 * Shared by the profile skill actions and résumé-import merge.
 */
export async function resolveSkillIds(
  supabase: DB,
  names: string[],
): Promise<string[]> {
  const unique = [
    ...new Map(names.map((n) => [slugifySkill(n), n])).entries(),
  ].filter(([slug]) => slug.length > 0)
  if (unique.length === 0) return []
  const slugs = unique.map(([slug]) => slug)

  const { error: insertError } = await supabase.from("skill").upsert(
    unique.map(([slug, name]) => ({ slug, name: normalizeSkillName(name) })),
    { onConflict: "slug", ignoreDuplicates: true },
  )
  if (insertError) throw insertError

  const { data, error } = await supabase
    .from("skill")
    .select("id, slug")
    .in("slug", slugs)
  if (error) throw error

  const bySlug = new Map((data ?? []).map((row) => [row.slug, row.id]))
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((id): id is string => Boolean(id))
}
