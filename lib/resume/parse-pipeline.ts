import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

// TEMPORARY (D-025, 2026-09-05): swapped to Gemini — no Anthropic billing set
// up yet. `./claude.ts` has the same contract and is kept working; revert by
// changing this one import back to "@/lib/ai/claude".
import {
  extractResumeData,
  ResumeExtractionError,
  type ResumeExtractionResult,
} from "@/lib/ai/gemini"
import type { Database, Json } from "@/lib/supabase/database.types"

import { RESUME_DIFF_ALGORITHM_VERSION } from "./constants"
import { buildProposal } from "./diff"
import { loadProfileSnapshot } from "./profile-snapshot"

type Admin = SupabaseClient<Database>

/**
 * The résumé parse pipeline, as small units the Inngest function wires together
 * with `step.run`. Each unit is idempotent and takes an explicit `userId` so it
 * is safe under the RLS-bypassing admin client.
 */

export type ImportContext = {
  importId: string
  userId: string
  masterResumeId: string
  profileId: string
  storagePath: string
  storageBucket: string
}

class PipelineError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
    /** True for a transient failure Inngest should retry (e.g. a provider
     * rate limit / 5xx), false for a permanent one (bad data, ownership
     * mismatch, refused/malformed output). */
    readonly retriable = false,
  ) {
    super(message)
    this.name = "PipelineError"
  }
}

/**
 * Verify ownership and load what the pipeline needs. Returns `null` when the
 * import has already reached a terminal-ish state (idempotent replay).
 */
export async function loadImportContext(
  admin: Admin,
  input: { importId: string; userId: string; masterResumeId: string },
): Promise<ImportContext | null> {
  const { data: importRow, error } = await admin
    .from("resume_import")
    .select("id, user_id, master_resume_id, profile_id, status")
    .eq("id", input.importId)
    .single()
  if (error) throw new PipelineError(error.message, "Import record not found.")

  if (importRow.user_id !== input.userId) {
    throw new PipelineError(
      `import ${input.importId} belongs to ${importRow.user_id}, not ${input.userId}`,
      "Ownership check failed.",
    )
  }
  if (importRow.master_resume_id !== input.masterResumeId) {
    throw new PipelineError("master_resume_id mismatch", "Import record mismatch.")
  }
  if (["ready_for_review", "applied", "discarded"].includes(importRow.status)) {
    return null
  }

  const { data: resume, error: resumeError } = await admin
    .from("master_resume")
    .select("id, user_id, storage_bucket, storage_path")
    .eq("id", input.masterResumeId)
    .single()
  if (resumeError) {
    throw new PipelineError(resumeError.message, "Résumé file record not found.")
  }
  if (resume.user_id !== input.userId) {
    throw new PipelineError("master_resume owner mismatch", "Ownership check failed.")
  }

  return {
    importId: importRow.id,
    userId: importRow.user_id,
    masterResumeId: resume.id,
    profileId: importRow.profile_id,
    storagePath: resume.storage_path,
    storageBucket: resume.storage_bucket,
  }
}

export async function markImport(
  admin: Admin,
  importId: string,
  patch: Database["public"]["Tables"]["resume_import"]["Update"],
): Promise<void> {
  const { error } = await admin
    .from("resume_import")
    .update(patch)
    .eq("id", importId)
  if (error) throw new PipelineError(error.message, "Could not update the import.")
}

export async function downloadResume(
  admin: Admin,
  ctx: ImportContext,
): Promise<Uint8Array> {
  const { data, error } = await admin.storage
    .from(ctx.storageBucket)
    .download(ctx.storagePath)
  if (error || !data) {
    throw new PipelineError(
      error?.message ?? "no data",
      "Could not read the uploaded file.",
    )
  }
  return new Uint8Array(await data.arrayBuffer())
}

export type Extractor = (pdf: Uint8Array) => Promise<ResumeExtractionResult>

export async function runExtraction(
  bytes: Uint8Array,
  extractor: Extractor = extractResumeData,
): Promise<ResumeExtractionResult> {
  try {
    return await extractor(bytes)
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      // `code` differs slightly per provider (e.g. only Claude has "refused");
      // compare as a string so this stays correct across the Gemini/Claude
      // swap (D-025) without a shared error-code type.
      const code: string = error.code
      const userMessage =
        code === "refused"
          ? "The résumé couldn't be processed automatically. You can still fill in your profile manually."
          : code === "provider_error"
            ? "The parsing service is temporarily unavailable. Try again shortly."
            : "We couldn't read structured information from that PDF. If it's a scan or image, export a text-based PDF and re-upload."
      throw new PipelineError(error.message, userMessage, code === "provider_error")
    }
    throw error
  }
}

export async function persistExtraction(
  admin: Admin,
  ctx: ImportContext,
  result: ResumeExtractionResult,
): Promise<void> {
  await markImport(admin, ctx.importId, {
    status: "parsing",
    extracted: result.data,
    model: result.model,
    prompt_version: result.promptVersion,
    token_usage: result.usage,
  })
}

export async function buildAndPersistProposal(
  admin: Admin,
  ctx: ImportContext,
  result: ResumeExtractionResult,
): Promise<{ itemCount: number }> {
  const snapshot = await loadProfileSnapshot(admin, ctx.userId)
  const proposal = buildProposal(result.data, snapshot)

  // Replace any items from a previous partial run (idempotent rebuild).
  await admin.from("resume_import_item").delete().eq("resume_import_id", ctx.importId)

  if (proposal.length > 0) {
    const rows: Database["public"]["Tables"]["resume_import_item"]["Insert"][] =
      proposal.map((item) => ({
        user_id: ctx.userId,
        resume_import_id: ctx.importId,
        entity_type: item.entityType,
        classification: item.classification,
        field: item.field,
        proposed: item.proposed as unknown as Json,
        current: (item.current ?? null) as unknown as Json,
        match_target_id: item.matchTargetId,
        match_target_table: item.matchTargetTable,
        confidence: item.confidence,
        recommended: item.recommended,
      }))
    const { error } = await admin.from("resume_import_item").insert(rows)
    if (error) {
      throw new PipelineError(error.message, "Could not save the proposed changes.")
    }
  }

  await markImport(admin, ctx.importId, {
    status: "ready_for_review",
    algorithm_version: RESUME_DIFF_ALGORITHM_VERSION,
    reviewed_at: null,
  })
  await admin
    .from("master_resume")
    .update({ parse_status: "parsed", parse_error: null, parsed_at: new Date().toISOString() })
    .eq("id", ctx.masterResumeId)

  return { itemCount: proposal.length }
}

export async function markParseFailed(
  admin: Admin,
  input: { importId: string; masterResumeId: string; error: unknown },
): Promise<void> {
  const userMessage =
    input.error instanceof PipelineError
      ? input.error.userMessage
      : "Parsing failed unexpectedly. Try re-uploading."
  const detail =
    input.error instanceof Error ? input.error.message : String(input.error)

  await admin
    .from("resume_import")
    .update({ status: "failed", error: detail })
    .eq("id", input.importId)
  await admin
    .from("master_resume")
    .update({ parse_status: "failed", parse_error: userMessage })
    .eq("id", input.masterResumeId)
}

export { PipelineError }
