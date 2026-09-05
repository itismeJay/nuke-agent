import { z } from "zod"

/**
 * The shape Claude must return when extracting a résumé.
 *
 * Design rules (enforced by the prompt in `prompts.ts`, structurally reinforced
 * here):
 *   * Every scalar is `.nullish()` (null OR absent) — "not stated" ideally
 *     comes back as an explicit null, but the schema tolerates an omitted key
 *     too. Gemini's structured-output mode (`lib/ai/gemini.ts`) has no `null`
 *     JSON-Schema type and no `nullable` keyword, so its request-side schema
 *     can only mark a field optional, not nullable — the model omits fields it
 *     doesn't know rather than emitting `null` for them. Claude's structured
 *     output can do proper `null`, so this schema must accept both shapes.
 *   * Dates are free-ish strings (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`); the résumé
 *     rarely gives a full date. `lib/resume/normalize.ts` turns them into real
 *     `date` values, recording the precision.
 *   * `uncertain` lets the model flag a fact it is not confident it read
 *     correctly. The diff step turns that into `confidence = 'low'`, which is
 *     never pre-selected and never auto-applied (§12–13 of the direction).
 *   * Nothing here is ever written to the profile directly — it becomes
 *     `resume_import_item` proposals a human reviews first.
 */

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "freelance",
] as const

const nullableString = z.string().trim().min(1).max(5000).nullish()
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Expected YYYY, YYYY-MM or YYYY-MM-DD")
  .nullish()

export const extractedLinksSchema = z.object({
  linkedin: nullableString,
  github: nullableString,
  website: nullableString,
})

export const extractedPersonalSchema = z.object({
  full_name: nullableString,
  headline: nullableString,
  email: nullableString,
  phone: nullableString,
  location: nullableString,
  summary: z.string().trim().min(1).max(6000).nullish(),
  links: extractedLinksSchema.nullish(),
})

export const extractedExperienceSchema = z.object({
  company: nullableString,
  title: nullableString,
  employment_type: z.enum(EMPLOYMENT_TYPES).nullish(),
  location: nullableString,
  start_date: dateString,
  end_date: dateString,
  is_current: z.boolean().nullish(),
  description: z.string().trim().min(1).max(6000).nullish(),
  achievements: z.array(z.string().trim().min(1).max(1000)).max(40),
  uncertain: z.boolean().nullish(),
})

export const extractedSkillSchema = z.object({
  name: z.string().trim().min(1).max(120),
  uncertain: z.boolean().nullish(),
})

export const extractedProjectSchema = z.object({
  name: nullableString,
  role: nullableString,
  url: nullableString,
  description: z.string().trim().min(1).max(6000).nullish(),
  start_date: dateString,
  end_date: dateString,
  skills: z.array(z.string().trim().min(1).max(120)).max(40),
  uncertain: z.boolean().nullish(),
})

export const extractedEducationSchema = z.object({
  institution: nullableString,
  degree: nullableString,
  field_of_study: nullableString,
  grade: nullableString,
  start_date: dateString,
  end_date: dateString,
  description: z.string().trim().min(1).max(4000).nullish(),
  uncertain: z.boolean().nullish(),
})

export const extractedCertificationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: nullableString,
  issued_on: dateString,
  expires_on: dateString,
  credential_id: nullableString,
  credential_url: nullableString,
  uncertain: z.boolean().nullish(),
})

export const resumeExtractionSchema = z.object({
  personal: extractedPersonalSchema.nullish(),
  experiences: z.array(extractedExperienceSchema).max(60),
  skills: z.array(extractedSkillSchema).max(200),
  projects: z.array(extractedProjectSchema).max(60),
  education: z.array(extractedEducationSchema).max(30),
  certifications: z.array(extractedCertificationSchema).max(40),
})

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>
export type ExtractedExperience = z.infer<typeof extractedExperienceSchema>
export type ExtractedSkill = z.infer<typeof extractedSkillSchema>
export type ExtractedProject = z.infer<typeof extractedProjectSchema>
export type ExtractedEducation = z.infer<typeof extractedEducationSchema>
export type ExtractedCertification = z.infer<typeof extractedCertificationSchema>
export type ExtractedPersonal = z.infer<typeof extractedPersonalSchema>

/** An empty extraction — the shape when a résumé yields nothing usable. */
export const EMPTY_EXTRACTION: ResumeExtraction = {
  personal: null,
  experiences: [],
  skills: [],
  projects: [],
  education: [],
  certifications: [],
}
