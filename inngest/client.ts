import { Inngest } from "inngest"

/**
 * The Inngest client. Durable / retryable / multi-step background work only
 * (D-016) — ordinary synchronous work stays in the request path.
 *
 * `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` are read from the environment.
 * Locally, set `INNGEST_DEV=1` (inngest@4+ defaults to "cloud mode" and
 * demands a signing key otherwise) and run `npx inngest-cli@latest dev`
 * alongside `npm run dev` — it discovers `/api/inngest`.
 */
export const inngest = new Inngest({ id: "nook" })

/** Payload for the résumé parse workflow. */
export type ResumeUploadedData = {
  userId: string
  masterResumeId: string
  importId: string
  idempotencyKey: string
}

export const RESUME_UPLOADED_EVENT = "resume/uploaded" as const

/** Typed wrapper around `inngest.send` for the one event we emit today. */
export async function sendResumeUploaded(data: ResumeUploadedData) {
  return inngest.send({ name: RESUME_UPLOADED_EVENT, data })
}
