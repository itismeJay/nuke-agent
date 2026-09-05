import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

import type { CurrentProfile } from "./types"

type DB = SupabaseClient<Database>

/**
 * Load the current profile in the shape the résumé diff needs.
 *
 * Works with any client: the signed-in user's server client (RLS scopes it), or
 * the admin client inside Inngest (we pass an explicit `user_id` filter and the
 * caller has already verified ownership). Always filter by `user_id` so this is
 * safe under either.
 */
export async function loadProfileSnapshot(
  supabase: DB,
  userId: string,
): Promise<CurrentProfile> {
  const [profileRes, experienceRes, skillRes, projectRes, educationRes, certRes] =
    await Promise.all([
      supabase
        .from("profile")
        .select("id, full_name, headline, email, phone, location, summary, links")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("experience")
        .select(
          "id, company, title, employment_type, location, start_date, end_date, description, experience_achievement(content)",
        )
        .eq("user_id", userId),
      supabase
        .from("profile_skill")
        .select("skill(slug)")
        .eq("user_id", userId),
      supabase
        .from("project")
        .select("id, name, description")
        .eq("user_id", userId),
      supabase
        .from("education")
        .select("id, institution, degree, field_of_study, grade, description")
        .eq("user_id", userId),
      supabase
        .from("certification")
        .select("name")
        .eq("user_id", userId),
    ])

  if (profileRes.error) throw profileRes.error

  const links =
    profileRes.data.links && typeof profileRes.data.links === "object"
      ? (profileRes.data.links as Record<string, string>)
      : {}

  return {
    profileId: profileRes.data.id,
    personal: {
      full_name: profileRes.data.full_name,
      headline: profileRes.data.headline,
      email: profileRes.data.email,
      phone: profileRes.data.phone,
      location: profileRes.data.location,
      summary: profileRes.data.summary,
      links,
    },
    experiences: (experienceRes.data ?? []).map((row) => {
      const { experience_achievement, ...rest } = row
      return {
        ...rest,
        achievements: (experience_achievement ?? []).map((a) => a.content),
      }
    }),
    skillSlugs: (skillRes.data ?? [])
      .map((row) => row.skill?.slug)
      .filter((slug): slug is string => Boolean(slug)),
    projects: projectRes.data ?? [],
    education: educationRes.data ?? [],
    certificationNames: (certRes.data ?? []).map((row) => row.name),
  }
}
