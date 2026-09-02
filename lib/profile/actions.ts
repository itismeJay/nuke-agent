"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import type { SupabaseClient, User } from "@supabase/supabase-js"

import { resolveOwnProfileId } from "./owner"
import {
  achievementSchema,
  addProfileSkillSchema,
  applicationAnswerSchema,
  careerPreferencesSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  personalInfoSchema,
  projectSchema,
  updateProfileSkillSchema,
} from "./schemas"
import { normalizeSkillName, slugifySkill } from "./skills"

export type ActionState = {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

const OK: ActionState = { ok: true }

type DB = SupabaseClient<Database>

async function ctx(): Promise<
  { user: User; supabase: DB; profileId: string } | null
> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const profileId = await resolveOwnProfileId(supabase, user)
  return { user, supabase, profileId }
}

const UNAUTH: ActionState = { error: "Your session has expired. Sign in again." }

function fieldErrors(error: z.ZodError): ActionState {
  const fields: Record<string, string> = {}
  let formError: string | undefined
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".")
    if (key) {
      if (!fields[key]) fields[key] = issue.message
    } else {
      formError ??= issue.message
    }
  }
  if (Object.keys(fields).length === 0) {
    return { error: formError ?? "Please check the form and try again." }
  }
  return { error: "Please fix the highlighted fields.", fieldErrors: fields }
}

function readForm(
  formData: FormData,
  arrays: string[] = [],
  booleans: string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of new Set(formData.keys())) {
    if (arrays.includes(key)) {
      out[key] = formData
        .getAll(key)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
    } else {
      out[key] = formData.get(key)
    }
  }
  for (const key of arrays) if (!(key in out)) out[key] = []
  for (const key of booleans) {
    const value = formData.get(key)
    out[key] = value === "on" || value === "true"
  }
  return out
}

function done(): ActionState {
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return OK
}

function dbError(message?: string): ActionState {
  if (message && process.env.NODE_ENV !== "production") {
    console.error("[profile action]", message)
  }
  return { error: "Something went wrong saving that. Try again." }
}

function requireId(formData: FormData): string | null {
  const id = formData.get("id")
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? id : null
}

// ---------------------------------------------------------------------------
// Personal information
// ---------------------------------------------------------------------------

export async function savePersonalInfo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = personalInfoSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  const { link_linkedin, link_github, link_website, ...rest } = parsed.data
  const links: Record<string, string> = {}
  if (link_linkedin) links.linkedin = link_linkedin
  if (link_github) links.github = link_github
  if (link_website) links.website = link_website

  const { error } = await c.supabase
    .from("profile")
    .update({
      full_name: rest.full_name ?? null,
      headline: rest.headline ?? null,
      email: rest.email ?? null,
      phone: rest.phone ?? null,
      location: rest.location ?? null,
      summary: rest.summary ?? null,
      links,
    })
    .eq("id", c.profileId)

  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Career preferences
// ---------------------------------------------------------------------------

export async function savePreferences(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = careerPreferencesSchema.safeParse(
    readForm(
      formData,
      ["work_arrangements", "employment_types"],
      ["open_to_relocation"],
    ),
  )
  if (!parsed.success) return fieldErrors(parsed.error)
  const p = parsed.data

  const { error } = await c.supabase.from("career_preferences").upsert(
    {
      user_id: c.user.id,
      profile_id: c.profileId,
      desired_roles: p.desired_roles,
      desired_locations: p.desired_locations,
      work_arrangements: p.work_arrangements,
      employment_types: p.employment_types,
      min_salary: p.min_salary ?? null,
      salary_currency: p.salary_currency ?? null,
      salary_period: p.salary_period ?? null,
      open_to_relocation: p.open_to_relocation ?? null,
      availability: p.availability ?? null,
      seniority: p.seniority ?? null,
      notes: p.notes ?? null,
    },
    { onConflict: "user_id" },
  )

  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Experience + achievements
// ---------------------------------------------------------------------------

export async function saveExperience(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = experienceSchema.safeParse(readForm(formData, [], ["is_current"]))
  if (!parsed.success) return fieldErrors(parsed.error)
  const e = parsed.data

  const values = {
    company: e.company,
    title: e.title,
    employment_type: e.employment_type ?? null,
    location: e.location ?? null,
    start_date: e.start_date ?? null,
    end_date: e.end_date ?? null,
    description: e.description ?? null,
  }

  const id = requireId(formData)
  const { error } = id
    ? await c.supabase
        .from("experience")
        .update(values)
        .eq("id", id)
        .eq("user_id", c.user.id)
    : await c.supabase
        .from("experience")
        .insert({ ...values, user_id: c.user.id, profile_id: c.profileId })

  if (error) return dbError(error.message)
  return done()
}

export async function deleteExperience(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase.from("experience").delete().eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

export async function saveAchievement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const experienceId = formData.get("experience_id")
  if (typeof experienceId !== "string") return { error: "Missing experience." }

  const parsed = achievementSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  const id = requireId(formData)
  const { error } = id
    ? await c.supabase
        .from("experience_achievement")
        .update({ content: parsed.data.content })
        .eq("id", id)
        .eq("user_id", c.user.id)
    : await c.supabase.from("experience_achievement").insert({
        user_id: c.user.id,
        experience_id: experienceId,
        content: parsed.data.content,
        sort_order: parsed.data.sort_order,
      })

  if (error) {
    if (error.code === "23503") return { error: "That experience no longer exists." }
    return dbError(error.message)
  }
  return done()
}

export async function deleteAchievement(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase
    .from("experience_achievement")
    .delete()
    .eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Skills (shared canonical catalog + profile_skill / project_skill)
// ---------------------------------------------------------------------------

/**
 * Resolve skill names to catalog ids, inserting any that are new. The `skill`
 * catalog is append-only for `authenticated` (INSERT policy, no UPDATE), so we
 * insert-ignore-duplicates and then read every row back by slug.
 */
async function resolveSkillIds(supabase: DB, names: string[]): Promise<string[]> {
  const unique = [...new Map(names.map((n) => [slugifySkill(n), n])).entries()].filter(
    ([slug]) => slug.length > 0,
  )
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

export async function addSkill(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = addProfileSkillSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  let skillId: string
  try {
    ;[skillId] = await resolveSkillIds(c.supabase, [parsed.data.skill_name])
  } catch {
    return dbError()
  }
  if (!skillId) return { error: "Enter a skill name." }

  const { error } = await c.supabase.from("profile_skill").insert({
    user_id: c.user.id,
    profile_id: c.profileId,
    skill_id: skillId,
    proficiency: parsed.data.proficiency ?? null,
    years_experience: parsed.data.years_experience ?? null,
  })

  if (error) {
    if (error.code === "23505") return { error: "That skill is already on your profile." }
    return dbError(error.message)
  }
  return done()
}

export async function updateSkill(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to update." }

  const parsed = updateProfileSkillSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  const { error } = await c.supabase
    .from("profile_skill")
    .update({
      proficiency: parsed.data.proficiency ?? null,
      years_experience: parsed.data.years_experience ?? null,
    })
    .eq("id", id)
    .eq("user_id", c.user.id)

  if (error) return dbError(error.message)
  return done()
}

export async function removeSkill(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to remove." }
  const { error } = await c.supabase.from("profile_skill").delete().eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Projects + project skills
// ---------------------------------------------------------------------------

export async function saveProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = projectSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)
  const p = parsed.data

  const values = {
    name: p.name,
    role: p.role ?? null,
    url: p.url ?? null,
    description: p.description ?? null,
    start_date: p.start_date ?? null,
    end_date: p.end_date ?? null,
  }

  const id = requireId(formData)
  let projectId = id
  if (id) {
    const { error } = await c.supabase
      .from("project")
      .update(values)
      .eq("id", id)
      .eq("user_id", c.user.id)
    if (error) return dbError(error.message)
  } else {
    const { data, error } = await c.supabase
      .from("project")
      .insert({ ...values, user_id: c.user.id, profile_id: c.profileId })
      .select("id")
      .single()
    if (error || !data) return dbError(error?.message)
    projectId = data.id
  }

  if (!projectId) return dbError()

  // Replace the project's skill set.
  try {
    const skillIds = await resolveSkillIds(c.supabase, p.skill_names)
    await c.supabase.from("project_skill").delete().eq("project_id", projectId)
    if (skillIds.length > 0) {
      await c.supabase.from("project_skill").insert(
        skillIds.map((skillId) => ({
          user_id: c.user.id,
          project_id: projectId!,
          skill_id: skillId,
        })),
      )
    }
  } catch {
    return dbError()
  }

  return done()
}

export async function deleteProject(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase.from("project").delete().eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export async function saveEducation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = educationSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)
  const e = parsed.data

  const values = {
    institution: e.institution,
    degree: e.degree ?? null,
    field_of_study: e.field_of_study ?? null,
    grade: e.grade ?? null,
    start_date: e.start_date ?? null,
    end_date: e.end_date ?? null,
    description: e.description ?? null,
  }

  const id = requireId(formData)
  const { error } = id
    ? await c.supabase
        .from("education")
        .update(values)
        .eq("id", id)
        .eq("user_id", c.user.id)
    : await c.supabase
        .from("education")
        .insert({ ...values, user_id: c.user.id, profile_id: c.profileId })

  if (error) return dbError(error.message)
  return done()
}

export async function deleteEducation(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase.from("education").delete().eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export async function saveCertification(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = certificationSchema.safeParse(readForm(formData))
  if (!parsed.success) return fieldErrors(parsed.error)
  const cert = parsed.data

  const values = {
    name: cert.name,
    issuer: cert.issuer ?? null,
    issued_on: cert.issued_on ?? null,
    expires_on: cert.expires_on ?? null,
    credential_id: cert.credential_id ?? null,
    credential_url: cert.credential_url ?? null,
  }

  const id = requireId(formData)
  const { error } = id
    ? await c.supabase
        .from("certification")
        .update(values)
        .eq("id", id)
        .eq("user_id", c.user.id)
    : await c.supabase
        .from("certification")
        .insert({ ...values, user_id: c.user.id, profile_id: c.profileId })

  if (error) return dbError(error.message)
  return done()
}

export async function deleteCertification(formData: FormData): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase.from("certification").delete().eq("id", id)
  if (error) return dbError(error.message)
  return done()
}

// ---------------------------------------------------------------------------
// Reusable application answers
// ---------------------------------------------------------------------------

export async function saveApplicationAnswer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const parsed = applicationAnswerSchema.safeParse(
    readForm(formData, [], ["is_sensitive"]),
  )
  if (!parsed.success) return fieldErrors(parsed.error)
  const a = parsed.data

  const values = {
    question: a.question,
    answer: a.answer ?? null,
    category: a.category,
    is_sensitive: a.is_sensitive,
  }

  const id = requireId(formData)
  const { error } = id
    ? await c.supabase
        .from("application_answer")
        .update(values)
        .eq("id", id)
        .eq("user_id", c.user.id)
    : await c.supabase
        .from("application_answer")
        .insert({ ...values, user_id: c.user.id, profile_id: c.profileId })

  if (error) return dbError(error.message)
  return done()
}

export async function deleteApplicationAnswer(
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH
  const id = requireId(formData)
  if (!id) return { error: "Nothing to delete." }
  const { error } = await c.supabase
    .from("application_answer")
    .delete()
    .eq("id", id)
  if (error) return dbError(error.message)
  return done()
}
