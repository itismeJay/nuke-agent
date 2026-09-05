import { serve } from "inngest/next"

import { inngest } from "@/inngest/client"
import { parseResume } from "@/inngest/functions/parse-resume"

/**
 * Inngest's sync + execution endpoint. Unauthenticated by design — requests are
 * signature-verified with `INNGEST_SIGNING_KEY` in production; local dev needs
 * `INNGEST_DEV=1` set instead (inngest@4+ defaults to "cloud mode" and demands
 * a signing key otherwise). Excluded from `middleware.ts` (the `api/` matcher skip).
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [parseResume],
})
