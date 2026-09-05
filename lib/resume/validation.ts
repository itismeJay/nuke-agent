import { MAX_RESUME_BYTES } from "./constants"

/**
 * Upload validation for master résumés. Never trust the browser-supplied MIME
 * type or extension alone — sniff the actual bytes.
 */

export type ResumeFileError =
  | "empty"
  | "too_large"
  | "not_pdf"
  | "encrypted_pdf"

export type ResumeFileCheck =
  | { ok: true; safeFilename: string }
  | { ok: false; error: ResumeFileError }

/** `%PDF-` */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]

function startsWithPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false
  return PDF_MAGIC.every((byte, i) => bytes[i] === byte)
}

/**
 * Collapse a user-supplied filename to something safe to store and echo back:
 * strip directory components, keep a conservative character set, cap length,
 * force a `.pdf` extension. This is display/metadata only — the Storage object
 * key is a server-generated UUID, never the filename.
 */
export function sanitizeResumeFilename(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "resume.pdf"
  const withoutExt = base.replace(/\.pdf$/i, "")
  const cleaned = withoutExt
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
  return `${cleaned || "resume"}.pdf`
}

export function checkResumeFile(
  bytes: Uint8Array,
  rawFilename: string,
): ResumeFileCheck {
  if (bytes.length === 0) return { ok: false, error: "empty" }
  if (bytes.length > MAX_RESUME_BYTES) return { ok: false, error: "too_large" }
  if (!startsWithPdfMagic(bytes)) return { ok: false, error: "not_pdf" }

  // Reject encrypted PDFs early — Claude can't read them and the parse would
  // just fail slowly. A cheap heuristic: an /Encrypt entry in the trailer.
  const head = Buffer.from(
    bytes.subarray(0, Math.min(bytes.length, 4096)),
  ).toString("latin1")
  const tail = Buffer.from(
    bytes.subarray(Math.max(0, bytes.length - 4096)),
  ).toString("latin1")
  if (/\/Encrypt\b/.test(head) || /\/Encrypt\b/.test(tail)) {
    return { ok: false, error: "encrypted_pdf" }
  }

  return { ok: true, safeFilename: sanitizeResumeFilename(rawFilename) }
}

export function resumeFileErrorMessage(error: ResumeFileError): string {
  switch (error) {
    case "empty":
      return "That file is empty."
    case "too_large":
      return "Résumés must be 10 MB or smaller."
    case "not_pdf":
      return "Upload a PDF. Other formats aren't supported yet."
    case "encrypted_pdf":
      return "That PDF is password-protected. Save an unprotected copy and try again."
  }
}
