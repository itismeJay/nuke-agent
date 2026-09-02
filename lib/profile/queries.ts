import "server-only"

import { requireUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

import { computeCompleteness, type Completeness } from "./completeness"
import { resolveOwnProfileId } from "./owner"

export type SkillRow = Tables<"skill">
export type ProfileRow = Tables<"profile">
export type CareerPreferencesRow = Tables<"career_preferences">
export type EducationRow = Tables<"education">
export type CertificationRow = Tables<"certification">
export type ApplicationAnswerRow = Tables<"application_answer">

export type ExperienceWithAchievements = Tables<"experience"> & {
  achievements: Tables<"experience_achievement">[]
}
export type ProfileSkillWithSkill = Tables<"profile_skill"> & {
  skill: SkillRow
}
export type ProjectWithSkills = Tables<"project"> & {
  skills: SkillRow[]
}

export type CareerProfileData = {
  profileId: string
  profile: ProfileRow
  preferences: CareerPreferencesRow | null
  experiences: ExperienceWithAchievements[]
  skills: ProfileSkillWithSkill[]
  projects: ProjectWithSkills[]
  education: EducationRow[]
  certifications: CertificationRow[]
  answers: ApplicationAnswerRow[]
  catalog: SkillRow[]
  completeness: Completeness
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name)

/** Load everything `/profile` renders, scoped to the signed-in user by RLS. */
export async function loadCareerProfile(): Promise<CareerProfileData> {
  const user = await requireUser("/profile")
  const supabase = await createClient()
  const profileId = await resolveOwnProfileId(supabase, user)

  const [
    profileRes,
    preferencesRes,
    experienceRes,
    skillRes,
    projectRes,
    educationRes,
    certificationRes,
    answerRes,
    catalogRes,
  ] = await Promise.all([
    supabase.from("profile").select("*").eq("id", profileId).single(),
    supabase
      .from("career_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("experience")
      .select("*, experience_achievement(*)")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("profile_skill")
      .select("*, skill(*)")
      .eq("user_id", user.id),
    supabase
      .from("project")
      .select("*, project_skill(skill(*))")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("education")
      .select("*")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false, nullsFirst: true }),
    supabase
      .from("certification")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_on", { ascending: false, nullsFirst: false }),
    supabase
      .from("application_answer")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("skill").select("*").order("name"),
  ])

  if (profileRes.error) throw profileRes.error

  const experiences: ExperienceWithAchievements[] = (experienceRes.data ?? []).map(
    ({ experience_achievement, ...rest }) => ({
      ...rest,
      achievements: [...(experience_achievement ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }),
  )

  const skills: ProfileSkillWithSkill[] = (skillRes.data ?? [])
    .filter((row): row is ProfileSkillWithSkill => row.skill !== null)
    .sort((a, b) => byName(a.skill, b.skill))

  const projects: ProjectWithSkills[] = (projectRes.data ?? []).map(
    ({ project_skill, ...rest }) => ({
      ...rest,
      skills: (project_skill ?? [])
        .map((ps) => ps.skill)
        .filter((s): s is SkillRow => s !== null)
        .sort(byName),
    }),
  )

  const education = educationRes.data ?? []
  const certifications = certificationRes.data ?? []
  const answers = answerRes.data ?? []
  const preferences = preferencesRes.data ?? null

  const completeness = computeCompleteness({
    fullName: profileRes.data.full_name,
    headline: profileRes.data.headline,
    location: profileRes.data.location,
    summary: profileRes.data.summary,
    experienceCount: experiences.length,
    achievementCount: experiences.reduce(
      (total, exp) => total + exp.achievements.length,
      0,
    ),
    skillCount: skills.length,
    projectCount: projects.length,
    educationCount: education.length,
    hasPreferences: hasMeaningfulPreferences(preferences),
  })

  return {
    profileId,
    profile: profileRes.data,
    preferences,
    experiences,
    skills,
    projects,
    education,
    certifications,
    answers,
    catalog: catalogRes.data ?? [],
    completeness,
  }
}

/**
 * Just the completeness summary — for the dashboard, without loading every
 * record. Counts rows with `head: true` so no payload comes back.
 */
export async function loadProfileCompleteness(): Promise<Completeness> {
  const user = await requireUser()
  const supabase = await createClient()

  const [profileRes, expRes, achRes, skillRes, projRes, eduRes, prefRes] =
    await Promise.all([
      supabase
        .from("profile")
        .select("full_name, headline, location, summary")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("experience")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("experience_achievement")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("profile_skill")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("project")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("education")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("career_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

  return computeCompleteness({
    fullName: profileRes.data?.full_name ?? null,
    headline: profileRes.data?.headline ?? null,
    location: profileRes.data?.location ?? null,
    summary: profileRes.data?.summary ?? null,
    experienceCount: expRes.count ?? 0,
    achievementCount: achRes.count ?? 0,
    skillCount: skillRes.count ?? 0,
    projectCount: projRes.count ?? 0,
    educationCount: eduRes.count ?? 0,
    hasPreferences: hasMeaningfulPreferences(prefRes.data ?? null),
  })
}

/** A preferences row counts only if the user actually set something on it. */
export function hasMeaningfulPreferences(
  preferences: CareerPreferencesRow | null,
): boolean {
  if (!preferences) return false
  const arrays = [
    preferences.desired_roles,
    preferences.desired_locations,
    preferences.work_arrangements,
    preferences.employment_types,
  ]
  if (arrays.some((value) => Array.isArray(value) && value.length > 0)) return true
  return Boolean(
    preferences.min_salary ||
      preferences.availability ||
      preferences.seniority ||
      preferences.open_to_relocation !== null ||
      (preferences.notes && preferences.notes.trim().length > 0),
  )
}
