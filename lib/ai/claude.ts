import "server-only"

import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"

import { requireServerEnv } from "@/lib/env"

import {
  RESUME_EXTRACTION_PROMPT_VERSION,
  RESUME_EXTRACTION_SYSTEM,
  RESUME_EXTRACTION_USER,
} from "./prompts"
import { resumeExtractionSchema, type ResumeExtraction } from "./resume-schema"

/**
 * The single place the Anthropic SDK is used. Claude only ever parses/transcribes
 * constrained unstructured content here — it never computes an authoritative
 * result and its output never reaches trusted data without human review.
 *
 * No multi-provider abstraction until a second provider is real (D-001).
 *
 * DORMANT as of 2026-09-05 (D-025) — `lib/resume/parse-pipeline.ts` currently
 * imports `./gemini` instead, because Anthropic API billing wasn't set up yet
 * while a Gemini key was on hand. This file is intentionally left working and
 * untouched: switching back is a one-line import change in `parse-pipeline.ts`.
 * Do not delete this, and do not let it silently bit-rot — `resume-schema.ts`
 * and `prompts.ts` are shared with `./gemini.ts`, so both stay in sync.
 */

/** Bounded transcription task — Sonnet is more than sufficient (see the plan). */
export const RESUME_EXTRACTION_MODEL = "claude-sonnet-5"

export class ResumeExtractionError extends Error {
  constructor(
    readonly code:
      | "refused"
      | "no_output"
      | "invalid_output"
      | "provider_error",
    message: string,
  ) {
    super(message)
    this.name = "ResumeExtractionError"
  }
}

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: requireServerEnv("anthropicApiKey") })
  }
  return client
}

export type ResumeExtractionResult = {
  data: ResumeExtraction
  model: string
  promptVersion: string
  usage: { inputTokens: number; outputTokens: number }
}

/**
 * Extract structured facts from a résumé PDF. The PDF bytes are sent to Claude
 * as a document block (native PDF understanding — no text-extraction library);
 * the response is constrained to `resumeExtractionSchema` and validated again on
 * the way out.
 */
export async function extractResumeData(
  pdf: Uint8Array,
): Promise<ResumeExtractionResult> {
  const base64 = Buffer.from(pdf).toString("base64")

  let message
  try {
    message = await getClient().messages.parse({
      model: RESUME_EXTRACTION_MODEL,
      max_tokens: 16000,
      output_config: {
        effort: "low",
        format: zodOutputFormat(resumeExtractionSchema),
      },
      system: RESUME_EXTRACTION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: RESUME_EXTRACTION_USER },
          ],
        },
      ],
    })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new ResumeExtractionError(
        "provider_error",
        `Anthropic API error ${error.status ?? ""}: ${error.message}`,
      )
    }
    throw error
  }

  if (message.stop_reason === "refusal") {
    throw new ResumeExtractionError(
      "refused",
      "The model declined to process this document.",
    )
  }

  if (!message.parsed_output) {
    throw new ResumeExtractionError(
      "no_output",
      "The model returned no structured output.",
    )
  }

  // Defence in depth: re-validate rather than trusting the helper's parse.
  const revalidated = resumeExtractionSchema.safeParse(message.parsed_output)
  if (!revalidated.success) {
    throw new ResumeExtractionError(
      "invalid_output",
      `Extracted data failed schema validation: ${revalidated.error.message}`,
    )
  }

  return {
    data: revalidated.data,
    model: message.model ?? RESUME_EXTRACTION_MODEL,
    promptVersion: RESUME_EXTRACTION_PROMPT_VERSION,
    usage: {
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
    },
  }
}
