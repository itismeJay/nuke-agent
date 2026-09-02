import { z } from "zod"

/**
 * Zod schemas for every Career Profile Server Action boundary.
 *
 * Actions convert `FormData` into a plain object (arrays via `getAll`, booleans
 * normalized) and hand it to `schema.safeParse`. Nothing reaches Supabase
 * unvalidated. `user_id` and `profile_id` are resolved server-side from the
 * session and are never part of these schemas.
 */

const SOURCES = ["manual", "resume_import", "ai_suggested", "oauth"] as const

/** Trimmed string; "" and whitespace-only collapse to `undefined`. */
const optionalText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))

const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required.`).max(max)

const optionalUrl = () =>
  z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || /^https?:\/\/\S+$/.test(value),
      "Enter a full URL starting with http:// or https://.",
    )

const optionalDate = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use a valid date.",
    )

const endNotBeforeStart = <
  T extends { start_date?: string; end_date?: string },
>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (
    data.start_date &&
    data.end_date &&
    data.end_date < data.start_date
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["end_date"],
      message: "End date can't be before the start date.",
    })
  }
}

/** Accepts a string[] or a comma/newline-separated string; always yields string[]. */
const listField = (max = 50) =>
  z
    .preprocess(
      (value) => {
        if (Array.isArray(value)) return value
        if (typeof value === "string") {
          return value
            .split(/[,\n]/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
        }
        return []
      },
      z.array(z.string().trim().min(1).max(120)).max(max),
    )
    .transform((value) => value ?? [])

// ---------------------------------------------------------------------------

export const personalInfoSchema = z.object({
  full_name: optionalText(160),
  headline: optionalText(200),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Enter a valid email address.",
    ),
  phone: optionalText(40),
  location: optionalText(160),
  summary: optionalText(3000),
  link_linkedin: optionalUrl(),
  link_github: optionalUrl(),
  link_website: optionalUrl(),
})
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>

export const careerPreferencesSchema = z.object({
  desired_roles: listField(),
  desired_locations: listField(),
  work_arrangements: z
    .array(z.enum(["remote", "hybrid", "onsite"]))
    .optional()
    .transform((value) => value ?? []),
  employment_types: z
    .array(
      z.enum([
        "full_time",
        "part_time",
        "contract",
        "internship",
        "temporary",
      ]),
    )
    .optional()
    .transform((value) => value ?? []),
  min_salary: z.coerce
    .number()
    .int()
    .min(0, "Salary can't be negative.")
    .max(100_000_000)
    .optional(),
  salary_currency: optionalText(8),
  salary_period: z.enum(["year", "hour"]).optional(),
  open_to_relocation: z.boolean().optional(),
  availability: z
    .enum(["immediately", "one_month", "three_months", "exploring"])
    .optional(),
  seniority: optionalText(60),
  notes: optionalText(2000),
})
export type CareerPreferencesInput = z.infer<typeof careerPreferencesSchema>

export const experienceSchema = z
  .object({
    company: requiredText("Company", 200),
    title: requiredText("Title", 200),
    employment_type: z
      .enum([
        "full_time",
        "part_time",
        "contract",
        "internship",
        "temporary",
        "freelance",
      ])
      .optional(),
    location: optionalText(160),
    start_date: optionalDate(),
    is_current: z.boolean().optional().default(false),
    end_date: optionalDate(),
    description: optionalText(5000),
  })
  .transform((data) => ({
    ...data,
    end_date: data.is_current ? undefined : data.end_date,
  }))
  .superRefine(endNotBeforeStart)
export type ExperienceInput = z.infer<typeof experienceSchema>

export const achievementSchema = z.object({
  content: requiredText("Achievement", 600),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
})
export type AchievementInput = z.infer<typeof achievementSchema>

export const addProfileSkillSchema = z.object({
  skill_name: requiredText("Skill", 120),
  proficiency: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  years_experience: z.coerce
    .number()
    .min(0, "Years can't be negative.")
    .max(80)
    .optional(),
})
export type AddProfileSkillInput = z.infer<typeof addProfileSkillSchema>

export const updateProfileSkillSchema = z.object({
  proficiency: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  years_experience: z.coerce.number().min(0).max(80).optional(),
})

export const projectSchema = z
  .object({
    name: requiredText("Project name", 200),
    role: optionalText(160),
    url: optionalUrl(),
    description: optionalText(5000),
    start_date: optionalDate(),
    end_date: optionalDate(),
    skill_names: listField(40),
  })
  .superRefine(endNotBeforeStart)
export type ProjectInput = z.infer<typeof projectSchema>

export const educationSchema = z
  .object({
    institution: requiredText("Institution", 200),
    degree: optionalText(200),
    field_of_study: optionalText(200),
    grade: optionalText(60),
    start_date: optionalDate(),
    end_date: optionalDate(),
    description: optionalText(3000),
  })
  .superRefine(endNotBeforeStart)
export type EducationInput = z.infer<typeof educationSchema>

export const certificationSchema = z
  .object({
    name: requiredText("Certification name", 200),
    issuer: optionalText(200),
    issued_on: optionalDate(),
    expires_on: optionalDate(),
    credential_id: optionalText(160),
    credential_url: optionalUrl(),
  })
  .superRefine((data, ctx) => {
    if (
      data.issued_on &&
      data.expires_on &&
      data.expires_on < data.issued_on
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expires_on"],
        message: "Expiry can't be before the issue date.",
      })
    }
  })
export type CertificationInput = z.infer<typeof certificationSchema>

export const applicationAnswerSchema = z.object({
  question: requiredText("Question", 500),
  answer: optionalText(5000),
  category: z
    .enum([
      "general",
      "work_authorization",
      "sponsorship",
      "compensation",
      "demographic_eeo",
      "logistics",
      "other",
    ])
    .default("general"),
  is_sensitive: z.boolean().optional().default(false),
})
export type ApplicationAnswerInput = z.infer<typeof applicationAnswerSchema>

export const SKILL_SOURCE_VALUES = SOURCES
