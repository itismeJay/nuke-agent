/**
 * Bump `RESUME_DIFF_ALGORITHM_VERSION` when the matcher or classifier in
 * `match.ts` / `diff.ts` changes in a way that could produce a different
 * proposal for the same inputs. Stored on `resume_import.algorithm_version`.
 */
export const RESUME_DIFF_ALGORITHM_VERSION = "2026-09-03.1"

export const MASTER_RESUME_BUCKET = "master-resumes"

/** Upload limits — also enforced by the Storage bucket config. */
export const MAX_RESUME_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_RESUME_CONTENT_TYPE = "application/pdf"
