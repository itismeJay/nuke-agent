import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { resolveSkillIds } from "@/lib/profile/skills-catalog"
import type { Database } from "@/lib/supabase/database.types"

type DB = SupabaseClient<Database>
type ImportItem = Database["public"]["Tables"]["resume_import_item"]["Row"]

export type ApplyOutcome = {
  applied: number
  rejected: number
  skipped: number
  failed: number
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

/**
 * Which scalar columns a field-level item may write, per entity. `field` is set
 * by our own diff code, but items are user-insertable rows — so guard here too.
 */
const ALLOWED_FIELDS: Record<string, ReadonlySet<string>> = {
  personal_info: new Set([
    "full_name",
    "headline",
    "email",
    "phone",
    "location",
    "link:linkedin",
    "link:github",
    "link:website",
  ]),
  experience: new Set([
    "location",
    "description",
    "employment_type",
    "start_date",
    "end_date",
  ]),
  project: new Set(["description"]),
  education: new Set(["degree", "field_of_study", "grade", "description"]),
}

function fieldAllowed(entityType: string, field: string | null): boolean {
  if (!field) return false
  return ALLOWED_FIELDS[entityType]?.has(field) ?? false
}

/**
 * Merge accepted proposal items into the Career Profile.
 *
 * Rules (BUILD_PLAN Phase 3):
 *   * only items the user accepted are written; everything else is recorded as
 *     `rejected` and nothing changes
 *   * `unchanged` items are never written, even if somehow accepted
 *   * every written row is stamped `source = 'resume_import'`
 *   * a per-item failure is recorded on that item and does not abort the rest
 *   * idempotent: an item that already has `applied_at` is skipped
 *
 * Runs under the user's RLS-scoped client — every insert/update is naturally
 * tenant-checked, and the composite FKs are the backstop.
 */
export async function applyImport(
  supabase: DB,
  userId: string,
  profileId: string,
  items: ImportItem[],
  acceptedIds: Set<string>,
  overrides: Map<string, string>,
): Promise<ApplyOutcome> {
  const outcome: ApplyOutcome = { applied: 0, rejected: 0, skipped: 0, failed: 0 }

  for (const item of items) {
    if (item.applied_at) {
      outcome.skipped++
      continue
    }

    const accepted =
      acceptedIds.has(item.id) && item.classification !== "unchanged"

    if (!accepted) {
      await supabase
        .from("resume_import_item")
        .update({ decision: "rejected" })
        .eq("id", item.id)
      outcome.rejected++
      continue
    }

    const override = overrides.get(item.id) ?? null
    try {
      const appliedRowId = await applyOne(
        supabase,
        userId,
        profileId,
        item,
        override,
      )
      await supabase
        .from("resume_import_item")
        .update({
          decision: override ? "edited" : "accepted",
          applied_row_id: appliedRowId,
          applied_value: override ? { value: override } : item.proposed,
          applied_at: new Date().toISOString(),
          apply_error: null,
        })
        .eq("id", item.id)
      outcome.applied++
    } catch (error) {
      await supabase
        .from("resume_import_item")
        .update({
          decision: override ? "edited" : "accepted",
          apply_error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", item.id)
      outcome.failed++
    }
  }

  return outcome
}

async function applyOne(
  supabase: DB,
  userId: string,
  profileId: string,
  item: ImportItem,
  override: string | null,
): Promise<string | null> {
  const proposed = (item.proposed ?? {}) as Record<string, unknown>
  const value = override ?? asString(proposed.value)

  switch (item.entity_type) {
    case "personal_info": {
      if (!value || !fieldAllowed("personal_info", item.field)) return null
      if (item.field!.startsWith("link:")) {
        const key = item.field!.slice("link:".length)
        const { data } = await supabase
          .from("profile")
          .select("links")
          .eq("id", profileId)
          .single()
        const links = {
          ...((data?.links as Record<string, string> | null) ?? {}),
          [key]: value,
        }
        await update(supabase, "profile", profileId, { links })
      } else {
        await update(supabase, "profile", profileId, { [item.field!]: value })
      }
      return profileId
    }

    case "summary": {
      if (!value) return null
      await update(supabase, "profile", profileId, { summary: value })
      return profileId
    }

    case "experience": {
      if (item.match_target_id && item.field) {
        if (!value || !fieldAllowed("experience", item.field)) return null
        await update(supabase, "experience", item.match_target_id, {
          [item.field]: value,
        })
        return item.match_target_id
      }
      // NEW experience + its achievements
      const { data, error } = await supabase
        .from("experience")
        .insert({
          user_id: userId,
          profile_id: profileId,
          company: asString(proposed.company),
          title: asString(proposed.title),
          employment_type: asString(proposed.employment_type),
          location: asString(proposed.location),
          start_date: asString(proposed.start_date),
          end_date: asString(proposed.end_date),
          description: asString(proposed.description),
          source: "resume_import",
        })
        .select("id")
        .single()
      if (error || !data) throw error ?? new Error("insert failed")
      const achievements = Array.isArray(proposed.achievements)
        ? (proposed.achievements as unknown[]).map(asString).filter(Boolean)
        : []
      if (achievements.length > 0) {
        await supabase.from("experience_achievement").insert(
          achievements.map((content, index) => ({
            user_id: userId,
            experience_id: data.id,
            content: content as string,
            sort_order: index,
            source: "resume_import",
          })),
        )
      }
      return data.id
    }

    case "experience_achievement": {
      if (!item.match_target_id) return null
      const content = asString(proposed.content)
      if (!content) return null
      const { data, error } = await supabase
        .from("experience_achievement")
        .insert({
          user_id: userId,
          experience_id: item.match_target_id,
          content,
          source: "resume_import",
        })
        .select("id")
        .single()
      if (error || !data) throw error ?? new Error("insert failed")
      return data.id
    }

    case "skill": {
      const name = asString(proposed.name)
      if (!name) return null
      const [skillId] = await resolveSkillIds(supabase, [name])
      if (!skillId) throw new Error("could not resolve skill")
      const { error } = await supabase.from("profile_skill").insert({
        user_id: userId,
        profile_id: profileId,
        skill_id: skillId,
        source: "resume_import",
      })
      // Already on the profile — treat as applied, not an error.
      if (error && error.code !== "23505") throw error
      return skillId
    }

    case "project": {
      if (item.match_target_id && item.field) {
        if (!value || !fieldAllowed("project", item.field)) return null
        await update(supabase, "project", item.match_target_id, {
          [item.field]: value,
        })
        return item.match_target_id
      }
      const { data, error } = await supabase
        .from("project")
        .insert({
          user_id: userId,
          profile_id: profileId,
          name: asString(proposed.name),
          role: asString(proposed.role),
          url: asString(proposed.url),
          description: asString(proposed.description),
          start_date: asString(proposed.start_date),
          end_date: asString(proposed.end_date),
          source: "resume_import",
        })
        .select("id")
        .single()
      if (error || !data) throw error ?? new Error("insert failed")
      const skills = Array.isArray(proposed.skills)
        ? (proposed.skills as unknown[]).map(asString).filter((s): s is string => Boolean(s))
        : []
      if (skills.length > 0) {
        const ids = await resolveSkillIds(supabase, skills)
        if (ids.length > 0) {
          await supabase.from("project_skill").insert(
            ids.map((skillId) => ({
              user_id: userId,
              project_id: data.id,
              skill_id: skillId,
            })),
          )
        }
      }
      return data.id
    }

    case "education": {
      if (item.match_target_id && item.field) {
        if (!value || !fieldAllowed("education", item.field)) return null
        await update(supabase, "education", item.match_target_id, {
          [item.field]: value,
        })
        return item.match_target_id
      }
      const { data, error } = await supabase
        .from("education")
        .insert({
          user_id: userId,
          profile_id: profileId,
          institution: asString(proposed.institution),
          degree: asString(proposed.degree),
          field_of_study: asString(proposed.field_of_study),
          grade: asString(proposed.grade),
          description: asString(proposed.description),
          start_date: asString(proposed.start_date),
          end_date: asString(proposed.end_date),
          source: "resume_import",
        })
        .select("id")
        .single()
      if (error || !data) throw error ?? new Error("insert failed")
      return data.id
    }

    case "certification": {
      const name = asString(proposed.name)
      if (!name) return null
      const { data, error } = await supabase
        .from("certification")
        .insert({
          user_id: userId,
          profile_id: profileId,
          name,
          issuer: asString(proposed.issuer),
          issued_on: asString(proposed.issued_on),
          expires_on: asString(proposed.expires_on),
          credential_id: asString(proposed.credential_id),
          credential_url: asString(proposed.credential_url),
          source: "resume_import",
        })
        .select("id")
        .single()
      if (error || !data) throw error ?? new Error("insert failed")
      return data.id
    }
  }

  return null
}

async function update(
  supabase: DB,
  table: "profile" | "experience" | "project" | "education",
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // Dynamic single-column patches — the column name comes from a fixed allow-list
  // (`resume_import_item.field`), not user input.
  const { error } = await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id)
  if (error) throw error
}
