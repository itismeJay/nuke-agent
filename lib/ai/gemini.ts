import "server-only"

import { GoogleGenAI } from "@google/genai"
import { z } from "zod"

import { requireServerEnv } from "@/lib/env"

import {
  RESUME_EXTRACTION_PROMPT_VERSION,
  RESUME_EXTRACTION_SYSTEM,
  RESUME_EXTRACTION_USER,
} from "./prompts"
import { resumeExtractionSchema, type ResumeExtraction } from "./resume-schema"

/**
 * Résumé extraction via Google Gemini.
 *
 * TEMPORARY provider swap (2026-09-05, D-025) — the Anthropic implementation
 * in `./claude.ts` is left in place, unused, as a one-import revert once
 * Anthropic API billing is set up. Do not delete `claude.ts`; do not build a
 * multi-provider abstraction around this swap (D-001) — it's a single import
 * in `lib/resume/parse-pipeline.ts` either way.
 *
 * Same contract as `./claude.ts`: `extractResumeData()` returns a validated
 * `ResumeExtraction`, never partial/fabricated data. Claude only ever
 * parses/transcribes constrained unstructured content here — it never
 * computes an authoritative result and its output never reaches trusted data
 * without human review (same invariant, different provider).
 */

/**
 * Flash-tier model on this key's free API tier as of 2026-09-05
 * (`ai.models.list()` + a live smoke test). Every Pro-tier model
 * (`gemini-*-pro*`, incl. the `gemini-pro-latest` alias) returned
 * `RESOURCE_EXHAUSTED` — free-tier quota 0 — so Pro is billing-only on this
 * account.
 *
 * Was `gemini-3.8-flash`, switched to `gemini-3.5-flash-lite` the same day
 * after `gemini-3.8-flash`'s free-tier daily quota (20 requests/day,
 * `GenerateRequestsPerDayPerProjectPerModel-FreeTier`) was exhausted by
 * testing. Free-tier quota is tracked per model, not per key/project, so a
 * different model has its own separate (still finite, not "unlimited")
 * allowance. Re-check `ai.models.list()` and smoke-test before bumping this;
 * model names and per-model quotas churn.
 */
export const RESUME_EXTRACTION_MODEL = "gemini-3.5-flash-lite"

export class ResumeExtractionError extends Error {
  constructor(
    readonly code: "no_output" | "invalid_output" | "provider_error",
    message: string,
  ) {
    super(message)
    this.name = "ResumeExtractionError"
  }
}

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: requireServerEnv("geminiApiKey") })
  }
  return client
}

/**
 * Gemini's `responseJsonSchema` only honors a specific subset of JSON Schema
 * keywords (`$id`, `$defs`, `$ref`, `$anchor`, `type`, `format`, `title`,
 * `description`, `enum`, `items`, `prefixItems`, `minItems`, `maxItems`,
 * `minimum`, `maximum`, `anyOf`, `oneOf`, `properties`,
 * `additionalProperties`, `required`, `propertyOrdering` — see the SDK's
 * `GenerateContentConfig.responseJsonSchema` doc comment). Anything else in
 * the request is rejected wholesale with an opaque `400 INVALID_ARGUMENT` —
 * confirmed live, three ways:
 *   1. `resumeExtractionSchema`'s `.regex()` (`pattern`) and `.min()/.max()`
 *      on strings (`minLength`/`maxLength`) aren't in the list.
 *   2. Zod's `.nullish()` on an object/string compiles to
 *      `anyOf: [<type>, {type:"null"}]`; on a primitive (boolean here) it
 *      compiles to the differently-shaped `type: ["boolean", "null"]`. Gemini
 *      has no `"null"` JSON type and no `nullable` keyword (unlike its older
 *      OpenAPI-style `responseSchema`, which uses `nullable: true`) — both
 *      forms have to be collapsed to just the non-null type, and the property
 *      then can't stay in `required`. The model omits what it doesn't know
 *      instead of emitting an explicit `null` for it.
 *   3. On `gemini-3.5-flash-lite` specifically (not reproduced on
 *      `gemini-3.8-flash`), an array `items` schema that combines a `boolean`
 *      property with the array's own `maxItems` 400s — either alone is fine,
 *      only the combination isn't. Undocumented, confirmed live by bisecting
 *      the request. `minItems`/`maxItems` are dropped from the outgoing
 *      schema entirely rather than chasing which combinations a given model
 *      tolerates — cheap to give up since `resumeExtractionSchema` already
 *      re-validates real array sizes on the way back out.
 *
 * `resumeExtractionSchema` still enforces its real constraints on the way back
 * out (`safeParse` below) and accepts an omitted key the same as a null one
 * (`.nullish()`, not `.nullable()`) — this only loosens what we ASK the model
 * to produce, not what we accept.
 */
const GEMINI_SCHEMA_KEYS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
])

function isNullOnlySchema(node: unknown): boolean {
  return (
    !!node &&
    typeof node === "object" &&
    (node as Record<string, unknown>).type === "null" &&
    Object.keys(node as object).length === 1
  )
}

/** Sanitize one schema node. Reports whether it accepted an explicit null so
 * the enclosing object can drop the property from `required`. */
function sanitizeNode(node: unknown): { schema: unknown; nullable: boolean } {
  if (Array.isArray(node)) {
    return { schema: node.map((n) => sanitizeNode(n).schema), nullable: false }
  }
  if (!node || typeof node !== "object") return { schema: node, nullable: false }

  const obj = node as Record<string, unknown>

  // Form 1 (object/string/etc.): anyOf: [<schema>, {type:"null"}]
  if (Array.isArray(obj.anyOf)) {
    const branches = obj.anyOf as unknown[]
    const nonNull = branches.filter((b) => !isNullOnlySchema(b))
    const hadNull = nonNull.length !== branches.length

    if (nonNull.length === 0) {
      // Fully-null field — shouldn't happen; fall back to a permissive string
      // rather than send Gemini a schema with no representable value.
      return { schema: { type: "string" }, nullable: true }
    }
    if (nonNull.length === 1) {
      const { anyOf: _anyOf, ...rest } = obj
      const inner = sanitizeNode({ ...rest, ...(nonNull[0] as object) })
      return { schema: inner.schema, nullable: hadNull || inner.nullable }
    }
    const { anyOf: _anyOf2, ...rest2 } = obj
    return {
      schema: sanitizeSchemaObject({
        ...rest2,
        anyOf: nonNull.map((b) => sanitizeNode(b).schema),
      }),
      nullable: hadNull,
    }
  }

  // Form 2 (primitives, e.g. boolean): type: ["boolean", "null"]
  if (Array.isArray(obj.type)) {
    const types = (obj.type as unknown[]).filter((t) => t !== "null")
    const hadNull = types.length !== (obj.type as unknown[]).length
    return {
      schema: sanitizeSchemaObject({
        ...obj,
        type: types.length === 1 ? types[0] : types,
      }),
      nullable: hadNull,
    }
  }

  return { schema: sanitizeSchemaObject(obj), nullable: false }
}

function sanitizeSchemaObject(obj: Record<string, unknown>): unknown {
  const out: Record<string, unknown> = {}
  const nullableProps = new Set<string>()

  if (obj.properties && typeof obj.properties === "object") {
    out.properties = Object.fromEntries(
      Object.entries(obj.properties as Record<string, unknown>).map(([key, value]) => {
        const result = sanitizeNode(value)
        if (result.nullable) nullableProps.add(key)
        return [key, result.schema]
      }),
    )
  }
  if (obj.$defs && typeof obj.$defs === "object") {
    out.$defs = Object.fromEntries(
      Object.entries(obj.$defs as Record<string, unknown>).map(([key, value]) => [
        key,
        sanitizeNode(value).schema,
      ]),
    )
  }
  for (const key of GEMINI_SCHEMA_KEYS) {
    if (key === "properties" || key === "$defs" || key === "required") continue
    if (key in obj) out[key] = sanitizeNode(obj[key]).schema
  }
  if (Array.isArray(obj.required)) {
    out.required = (obj.required as string[]).filter((name) => !nullableProps.has(name))
  }
  return out
}

function toGeminiJsonSchema(node: unknown): unknown {
  return sanitizeNode(node).schema
}

// Reuse the same Zod schema the Anthropic path validates against, sanitized
// to the keyword subset Gemini's structured output accepts.
const RESPONSE_JSON_SCHEMA = toGeminiJsonSchema(z.toJSONSchema(resumeExtractionSchema))

export type ResumeExtractionResult = {
  data: ResumeExtraction
  model: string
  promptVersion: string
  usage: { inputTokens: number; outputTokens: number }
}

/**
 * Extract structured facts from a résumé PDF. The PDF bytes are sent to
 * Gemini as inline document data (native PDF understanding — no
 * text-extraction library); the response is constrained to
 * `resumeExtractionSchema` via `responseJsonSchema` and validated again on the
 * way out.
 */
export async function extractResumeData(
  pdf: Uint8Array,
): Promise<ResumeExtractionResult> {
  const base64 = Buffer.from(pdf).toString("base64")

  let response
  try {
    response = await getClient().models.generateContent({
      model: RESUME_EXTRACTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64 } },
            { text: RESUME_EXTRACTION_USER },
          ],
        },
      ],
      config: {
        systemInstruction: RESUME_EXTRACTION_SYSTEM,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_JSON_SCHEMA,
      },
    })
  } catch (error) {
    throw new ResumeExtractionError(
      "provider_error",
      error instanceof Error ? error.message : String(error),
    )
  }

  const text = response.text
  if (!text) {
    throw new ResumeExtractionError(
      "no_output",
      "The model returned no structured output.",
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(text)
  } catch {
    throw new ResumeExtractionError(
      "invalid_output",
      "The model's output was not valid JSON.",
    )
  }

  // Defence in depth: re-validate rather than trusting responseJsonSchema to
  // have been honored exactly.
  const revalidated = resumeExtractionSchema.safeParse(parsedJson)
  if (!revalidated.success) {
    throw new ResumeExtractionError(
      "invalid_output",
      `Extracted data failed schema validation: ${revalidated.error.message}`,
    )
  }

  return {
    data: revalidated.data,
    model: response.modelVersion ?? RESUME_EXTRACTION_MODEL,
    promptVersion: RESUME_EXTRACTION_PROMPT_VERSION,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  }
}
