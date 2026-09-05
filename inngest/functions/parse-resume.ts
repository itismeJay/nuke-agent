import { NonRetriableError } from "inngest"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildAndPersistProposal,
  downloadResume,
  loadImportContext,
  markImport,
  markParseFailed,
  persistExtraction,
  PipelineError,
  runExtraction,
} from "@/lib/resume/parse-pipeline"

import { inngest, RESUME_UPLOADED_EVENT, type ResumeUploadedData } from "../client"

/**
 * Résumé parse workflow.
 *
 *   download → constrained AI extraction → deterministic diff → proposal
 *
 * - one run per user at a time (`concurrency`), so a burst of uploads doesn't
 *   race the same profile snapshot
 * - `idempotency` dedupes redelivery of the same event; each step is memoized,
 *   and `loadImportContext` short-circuits an import that already reached
 *   review/applied — so a retry never creates duplicate rows
 * - the PDF bytes never cross a step boundary (not JSON-serialisable); download
 *   and extraction share one step that returns the JSON extraction
 * - `onFailure` records a user-safe failure on the import + master_resume once
 *   retries are exhausted
 */
export const parseResume = inngest.createFunction(
  {
    id: "parse-resume",
    triggers: [{ event: RESUME_UPLOADED_EVENT }],
    concurrency: { key: "event.data.userId", limit: 1 },
    idempotency: "event.data.idempotencyKey",
    retries: 3,
    onFailure: async ({ event, error }) => {
      const data = event.data.event.data as ResumeUploadedData
      await markParseFailed(createAdminClient(), {
        importId: data.importId,
        masterResumeId: data.masterResumeId,
        error,
      })
    },
  },
  async ({ event, step }) => {
    const data = event.data as ResumeUploadedData
    const admin = createAdminClient()

    const ctx = await step.run("load-context", async () => {
      try {
        return await loadImportContext(admin, {
          importId: data.importId,
          userId: data.userId,
          masterResumeId: data.masterResumeId,
        })
      } catch (error) {
        // Ownership / missing-record failures are permanent.
        throw new NonRetriableError(
          error instanceof Error ? error.message : String(error),
        )
      }
    })

    if (!ctx) return { skipped: true, reason: "already processed" }

    await step.run("mark-extracting", () =>
      markImport(admin, ctx.importId, { status: "extracting", error: null }),
    )

    const extraction = await step.run("extract", async () => {
      const bytes = await downloadResume(admin, ctx)
      try {
        return await runExtraction(bytes)
      } catch (error) {
        // A refused / malformed-output parse won't get better on retry.
        // A transient provider error (rate limit, 5xx) should let Inngest's
        // built-in retry/backoff (`retries: 3` above) have a shot first.
        if (error instanceof PipelineError && !error.retriable) {
          throw new NonRetriableError(error.message)
        }
        throw error
      }
    })

    await step.run("persist-extraction", () =>
      persistExtraction(admin, ctx, extraction),
    )

    const result = await step.run("build-proposal", () =>
      buildAndPersistProposal(admin, ctx, extraction),
    )

    return { importId: ctx.importId, items: result.itemCount }
  },
)
