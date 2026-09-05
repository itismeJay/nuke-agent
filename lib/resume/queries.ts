import "server-only"

import { requireUser } from "@/lib/auth/user"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

import { MASTER_RESUME_BUCKET } from "./constants"

export type MasterResumeRow = Tables<"master_resume">
export type ResumeImportRow = Tables<"resume_import">
export type ResumeImportItemRow = Tables<"resume_import_item">

export type MasterResumeListEntry = {
  resume: MasterResumeRow
  latestImport: Pick<
    ResumeImportRow,
    "id" | "status" | "error" | "created_at" | "applied_at"
  > | null
  reviewable: boolean
}

/** Everything the `/resumes` page renders for the Master Resumes section. */
export async function listMasterResumes(): Promise<MasterResumeListEntry[]> {
  const user = await requireUser("/resumes")
  const supabase = await createClient()

  const [resumeRes, importRes] = await Promise.all([
    supabase
      .from("master_resume")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("resume_import")
      .select("id, master_resume_id, status, error, created_at, applied_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  if (resumeRes.error) throw resumeRes.error

  const latestByResume = new Map<
    string,
    NonNullable<typeof importRes.data>[number]
  >()
  for (const row of importRes.data ?? []) {
    if (!latestByResume.has(row.master_resume_id)) {
      latestByResume.set(row.master_resume_id, row)
    }
  }

  return (resumeRes.data ?? []).map((resume) => {
    const latest = latestByResume.get(resume.id) ?? null
    return {
      resume,
      latestImport: latest
        ? {
            id: latest.id,
            status: latest.status,
            error: latest.error,
            created_at: latest.created_at,
            applied_at: latest.applied_at,
          }
        : null,
      reviewable: latest?.status === "ready_for_review",
    }
  })
}

export type ResumeImportDetail = {
  import: ResumeImportRow
  resume: Pick<MasterResumeRow, "id" | "original_filename" | "uploaded_at">
  items: ResumeImportItemRow[]
}

/** The review page. Returns null if the import isn't the caller's. */
export async function loadResumeImport(
  importId: string,
): Promise<ResumeImportDetail | null> {
  const user = await requireUser(`/resumes`)
  const supabase = await createClient()

  const { data: importRow, error } = await supabase
    .from("resume_import")
    .select("*")
    .eq("id", importId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (error) throw error
  if (!importRow) return null

  const [resumeRes, itemRes] = await Promise.all([
    supabase
      .from("master_resume")
      .select("id, original_filename, uploaded_at")
      .eq("id", importRow.master_resume_id)
      .single(),
    supabase
      .from("resume_import_item")
      .select("*")
      .eq("resume_import_id", importId)
      .order("entity_type", { ascending: true })
      .order("created_at", { ascending: true }),
  ])
  if (resumeRes.error) throw resumeRes.error

  return {
    import: importRow,
    resume: resumeRes.data,
    items: itemRes.data ?? [],
  }
}

/** A short-lived signed URL to view the original PDF (attachment, not inline). */
export async function signMasterResumeUrl(
  resumeId: string,
): Promise<string | null> {
  const user = await requireUser("/resumes")
  const supabase = await createClient()

  const { data: resume } = await supabase
    .from("master_resume")
    .select("storage_path, original_filename")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!resume) return null

  const { data } = await supabase.storage
    .from(MASTER_RESUME_BUCKET)
    .createSignedUrl(resume.storage_path, 60, {
      download: resume.original_filename,
    })
  return data?.signedUrl ?? null
}
