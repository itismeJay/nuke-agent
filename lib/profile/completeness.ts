/**
 * Career Profile completeness.
 *
 * A deliberately simple weighted checklist — enough to nudge the user toward a
 * profile that later phases (matching, tailoring) can work with, without
 * pretending to score profile *quality*. Pure function; unit-tested; rendered
 * on `/profile` and the dashboard.
 */

export type CompletenessInput = {
  fullName: string | null
  headline: string | null
  location: string | null
  summary: string | null
  experienceCount: number
  achievementCount: number
  skillCount: number
  projectCount: number
  educationCount: number
  hasPreferences: boolean
}

export type CompletenessSection = {
  key: string
  label: string
  weight: number
  complete: boolean
}

export type Completeness = {
  score: number
  sections: CompletenessSection[]
}

const has = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0

/** Minimum skills before the Skills section counts as done. */
export const SKILLS_TARGET = 3

export function computeCompleteness(input: CompletenessInput): Completeness {
  const sections: CompletenessSection[] = [
    {
      key: "personal",
      label: "Personal info",
      weight: 15,
      complete:
        has(input.fullName) &&
        has(input.location) &&
        (has(input.summary) || has(input.headline)),
    },
    {
      key: "experience",
      label: "Work experience",
      weight: 25,
      complete: input.experienceCount > 0,
    },
    {
      key: "achievements",
      label: "Achievements",
      weight: 10,
      complete: input.achievementCount > 0,
    },
    {
      key: "skills",
      label: "Skills",
      weight: 15,
      complete: input.skillCount >= SKILLS_TARGET,
    },
    {
      key: "projects",
      label: "Projects",
      weight: 10,
      complete: input.projectCount > 0,
    },
    {
      key: "education",
      label: "Education",
      weight: 10,
      complete: input.educationCount > 0,
    },
    {
      key: "preferences",
      label: "Career preferences",
      weight: 15,
      complete: input.hasPreferences,
    },
  ]

  const score = sections.reduce(
    (total, section) => total + (section.complete ? section.weight : 0),
    0,
  )

  return { score, sections }
}
