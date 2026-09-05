import type { Tables } from "@/lib/supabase/database.types"

/**
 * A snapshot of the CURRENT career profile, in the shape the diff needs.
 * Loaded by `profile-snapshot.ts` under whichever Supabase client the caller
 * has (the user's server client on `/resumes`, the admin client inside Inngest).
 */
export type CurrentProfile = {
  profileId: string
  personal: {
    full_name: string | null
    headline: string | null
    email: string | null
    phone: string | null
    location: string | null
    summary: string | null
    links: Record<string, string>
  }
  experiences: Array<
    Pick<
      Tables<"experience">,
      | "id"
      | "company"
      | "title"
      | "employment_type"
      | "location"
      | "start_date"
      | "end_date"
      | "description"
    > & { achievements: string[] }
  >
  skillSlugs: string[]
  projects: Array<Pick<Tables<"project">, "id" | "name" | "description">>
  education: Array<
    Pick<
      Tables<"education">,
      | "id"
      | "institution"
      | "degree"
      | "field_of_study"
      | "grade"
      | "description"
    >
  >
  certificationNames: string[]
}

export type ItemClassification = "new" | "changed" | "unchanged" | "conflict"
export type ItemConfidence = "high" | "low"

export type EntityType =
  | "personal_info"
  | "summary"
  | "experience"
  | "experience_achievement"
  | "skill"
  | "project"
  | "education"
  | "certification"

/** A proposal item, before it is written to `resume_import_item`. */
export type ProposalItem = {
  entityType: EntityType
  classification: ItemClassification
  field: string | null
  /** Apply-ready payload for this fact. */
  proposed: Record<string, unknown>
  /** Snapshot of the matched current value(s), for the review UI. */
  current: Record<string, unknown> | null
  matchTargetId: string | null
  matchTargetTable: string | null
  confidence: ItemConfidence
  recommended: boolean
}
