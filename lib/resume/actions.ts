"use server"

import { createHash } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/user"
import type { ActionState } from "@/lib/profile/actions"
import { resolveOwnProfileId } from "@/lib/profile/owner"
import { createClient } from "@/lib/supabase/server"

import { applyImport } from "./apply"
import { signMasterResumeUrl } from "./queries"
import {
  ALLOWED_RESUME_CONTENT_TYPE,
  MASTER_RESUME_BUCKET,
} from "./constants"
import {
  sendResumeUploaded,
  type ResumeUploadedData,
} from "@/inngest/client"
import { checkResumeFile, resumeFileErrorMessage } from "./validation"

const UNAUTH: ActionState = { error: "Your session has expired. Sign in again." }

function fail(message: string): ActionState {
  return { error: message }
}

function ok(): ActionState {
  revalidatePath("/resumes")
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { ok: true }
}

async function ctx() {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const profileId = await resolveOwnProfileId(supabase, user)
  return { user, supabase, profileId }
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

/**
 * Validate + store a résumé PDF, then queue an async parse. Returns quickly —
 * the parse itself runs in Inngest.
 */
export async function uploadMasterResume(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a PDF to upload.")
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const check = checkResumeFile(bytes, file.name)
  if (!check.ok) return fail(resumeFileErrorMessage(check.error))

  const storagePath = `${c.user.id}/${crypto.randomUUID()}.pdf`
  const checksum = sha256Hex(bytes)

  const { count } = await c.supabase
    .from("master_resume")
    .select("id", { count: "exact", head: true })
    .eq("user_id", c.user.id)
  const isPrimary = (count ?? 0) === 0

  const { data: resume, error: insertError } = await c.supabase
    .from("master_resume")
    .insert({
      user_id: c.user.id,
      profile_id: c.profileId,
      storage_bucket: MASTER_RESUME_BUCKET,
      storage_path: storagePath,
      original_filename: check.safeFilename,
      content_type: ALLOWED_RESUME_CONTENT_TYPE,
      byte_size: bytes.byteLength,
      checksum,
      is_primary: isPrimary,
      parse_status: "pending",
    })
    .select("id")
    .single()
  if (insertError || !resume) {
    return fail("Couldn't save that résumé. Try again.")
  }

  const upload = await c.supabase.storage
    .from(MASTER_RESUME_BUCKET)
    .upload(storagePath, bytes, {
      contentType: ALLOWED_RESUME_CONTENT_TYPE,
      upsert: false,
    })
  if (upload.error) {
    await c.supabase.from("master_resume").delete().eq("id", resume.id)
    return fail("Couldn't upload that file. Try again.")
  }

  const idempotencyKey = crypto.randomUUID()
  const { data: importRow, error: importError } = await c.supabase
    .from("resume_import")
    .insert({
      user_id: c.user.id,
      master_resume_id: resume.id,
      profile_id: c.profileId,
      status: "queued",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single()
  if (importError || !importRow) {
    return fail("Uploaded, but couldn't start parsing. Use Retry on the résumé.")
  }

  const queued = await queueParse(c.supabase, {
    userId: c.user.id,
    masterResumeId: resume.id,
    importId: importRow.id,
    idempotencyKey,
  })
  if (!queued) {
    return {
      ok: true,
      error:
        "Uploaded. Parsing couldn't be queued (background processing isn't configured yet) — use Retry once it is.",
    }
  }

  return ok()
}

/** Emit the parse event; on failure, mark the import failed so Retry appears. */
async function queueParse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ResumeUploadedData,
): Promise<boolean> {
  try {
    await sendResumeUploaded(data)
    return true
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[resume] failed to queue parse", error)
    }
    await supabase
      .from("resume_import")
      .update({ status: "failed", error: "could not queue parse" })
      .eq("id", data.importId)
    await supabase
      .from("master_resume")
      .update({
        parse_status: "failed",
        parse_error:
          "Parsing couldn't be started. Retry once background processing is available.",
      })
      .eq("id", data.masterResumeId)
    return false
  }
}

/**
 * Re-queue a parse for a résumé whose latest import failed. Plain form action —
 * the résumé's status badge reflects the outcome.
 */
export async function retryResumeParse(formData: FormData): Promise<void> {
  const c = await ctx()
  if (!c) return
  const resumeId = String(formData.get("resume_id") ?? "")
  if (!resumeId) return

  const { data: resume } = await c.supabase
    .from("master_resume")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", c.user.id)
    .maybeSingle()
  if (!resume) return

  const idempotencyKey = crypto.randomUUID()
  const { data: importRow, error } = await c.supabase
    .from("resume_import")
    .insert({
      user_id: c.user.id,
      master_resume_id: resume.id,
      profile_id: c.profileId,
      status: "queued",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single()
  if (error || !importRow) return

  await c.supabase
    .from("master_resume")
    .update({ parse_status: "pending", parse_error: null })
    .eq("id", resume.id)

  await queueParse(c.supabase, {
    userId: c.user.id,
    masterResumeId: resume.id,
    importId: importRow.id,
    idempotencyKey,
  })
  revalidatePath("/resumes")
}

export async function setPrimaryResume(formData: FormData): Promise<void> {
  const c = await ctx()
  if (!c) return
  const resumeId = String(formData.get("resume_id") ?? "")
  if (!resumeId) return

  // Clear the current primary first (the partial unique index allows only one).
  await c.supabase
    .from("master_resume")
    .update({ is_primary: false })
    .eq("user_id", c.user.id)
    .eq("is_primary", true)

  await c.supabase
    .from("master_resume")
    .update({ is_primary: true })
    .eq("id", resumeId)
    .eq("user_id", c.user.id)
  revalidatePath("/resumes")
}

/** Redirect to a short-lived signed URL for the original PDF (downloads it). */
export async function viewMasterResume(formData: FormData): Promise<void> {
  const resumeId = String(formData.get("resume_id") ?? "")
  const url = resumeId ? await signMasterResumeUrl(resumeId) : null
  if (url) redirect(url)
}

export async function discardResumeImport(formData: FormData): Promise<void> {
  const c = await ctx()
  if (!c) return
  const importId = String(formData.get("import_id") ?? "")
  if (!importId) return

  await c.supabase
    .from("resume_import")
    .update({ status: "discarded", reviewed_at: new Date().toISOString() })
    .eq("id", importId)
    .eq("user_id", c.user.id)
    .eq("status", "ready_for_review")
  revalidatePath("/resumes")
  redirect("/resumes")
}

/**
 * Merge the accepted proposal items into the Career Profile.
 * `formData`: `import_id`, repeated `accept=<itemId>`, optional `value:<itemId>`.
 */
export async function applyResumeImport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const c = await ctx()
  if (!c) return UNAUTH

  const importId = String(formData.get("import_id") ?? "")
  if (!importId) return fail("Nothing to apply.")

  const { data: importRow } = await c.supabase
    .from("resume_import")
    .select("id, status")
    .eq("id", importId)
    .eq("user_id", c.user.id)
    .maybeSingle()
  if (!importRow) return fail("That import no longer exists.")
  if (importRow.status !== "ready_for_review" && importRow.status !== "applied") {
    return fail("This import isn't ready to apply.")
  }

  const { data: items, error: itemsError } = await c.supabase
    .from("resume_import_item")
    .select("*")
    .eq("resume_import_id", importId)
    .eq("user_id", c.user.id)
  if (itemsError) return fail("Couldn't load the proposed changes.")

  const acceptedIds = new Set(
    formData.getAll("accept").map((v) => String(v)),
  )
  const overrides = new Map<string, string>()
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("value:")) {
      const id = key.slice("value:".length)
      const text = String(value).trim()
      if (text) overrides.set(id, text)
    }
  }

  const outcome = await applyImport(
    c.supabase,
    c.user.id,
    c.profileId,
    items ?? [],
    acceptedIds,
    overrides,
  )

  await c.supabase
    .from("resume_import")
    .update({
      status: "applied",
      reviewed_at: new Date().toISOString(),
      applied_at: new Date().toISOString(),
    })
    .eq("id", importId)

  revalidatePath("/resumes")
  revalidatePath("/profile")
  revalidatePath("/dashboard")

  if (outcome.failed > 0) {
    return {
      ok: true,
      error: `Applied ${outcome.applied}. ${outcome.failed} couldn't be applied — open the import to see why.`,
    }
  }
  return { ok: true }
}
