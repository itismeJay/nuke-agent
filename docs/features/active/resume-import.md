# Feature: Master Resume Import, Re-import & Inngest Resume Processing (Phase 3)

## Status
CODE COMPLETE — 2026-09-03. Gates green (lint / typecheck / test 79 / test:db 11
/ build; `npm audit` clean; Supabase advisors clean). **Runtime verification
BLOCKED** on Inngest running (see below); the phase is **not** COMPLETE until a
real résumé has been parsed end to end. `SUPABASE_SERVICE_ROLE_KEY` (remote) is
set; extraction temporarily runs on Gemini, not Anthropic (D-025, 2026-09-05).

## Problem

The Career Profile (Phase 2) is fully usable with zero uploads (D-020), but
building it by hand is slow. A résumé should make the first pass fast — without
ever becoming the source of truth (D-002, D-003) and without a newer résumé
destroying or downgrading existing data.

## Scope (F1–F6 decisions — all built to the recommended option)

- **F1 / D-022** — extraction: Claude native PDF (`messages.parse` +
  `zodOutputFormat`), `claude-sonnet-5` `effort:low`, **PDF only**. Temporarily
  swapped to Gemini native PDF (`gemini-3.5-flash-lite` + `responseJsonSchema`) —
  D-025, until Anthropic billing is set up. Same contract, one-import revert.
- **F2 / D-022** — thin `lib/ai/` module, no multi-provider abstraction.
- **F3** — data model: `resume_import` (run + raw `extracted` jsonb, write-once)
  + `resume_import_item` (one reviewable fact, classified + decision + apply
  outcome).
- **F4** — deterministic matcher/classifier (`lib/resume/match.ts` + `diff.ts`,
  versioned `RESUME_DIFF_ALGORITHM_VERSION`). AI transcribes; code decides.
- **F5 / D-024** — Inngest job uses the service-role admin client (first
  sanctioned caller); merge uses the user's RLS client.
- **F6 / D-023** — Inngest Cloud, env-separated; `/api/inngest` route.

## Data / Contract Impact

Migration `20260902202542_resume_import_schema`:
- `master_resume`: drop `file_url`; add `storage_bucket/_path`,
  `original_filename`, `content_type`, `byte_size`, `checksum`, `page_count`,
  `is_primary` (+ partial unique), `parse_status` state machine, `parse_error`,
  `parsed_at`, `updated_at` (+ trigger), `unique (id, user_id)`.
- `resume_import`, `resume_import_item` — RLS "own rows", composite `(id,
  user_id)` FKs (D-018), `idempotency_key unique`.
- Private `master-resumes` Storage bucket + owner-scoped SELECT/INSERT policies
  (no UPDATE/DELETE → original immutable).

New deps: `@anthropic-ai/sdk`, `@google/genai` (D-025), `inngest`. `.npmrc`
`legacy-peer-deps=true`. `next.config.ts` `serverActions.bodySizeLimit`.

## Flow

1. `/resumes` → upload PDF → `uploadMasterResume` validates (magic bytes, size,
   filename, encrypted-PDF), stores at `{userId}/{uuid}.pdf`, inserts
   `master_resume` + `resume_import(queued)`, emits `resume/uploaded`.
2. Inngest `parseResume`: load+own-check → download+extract (one step, PDF bytes
   never cross a step boundary) → persist raw extraction → deterministic diff →
   insert `resume_import_item` rows → `ready_for_review`. `onFailure` records a
   user-safe failure. `concurrency` 1/user; `idempotency` on the event key.
3. `/resumes/import/[id]` → review grouped by NEW / fills-a-gap / CONFLICT /
   already-on-profile; per-item accept/reject/edit; "select recommended";
   low-confidence items never pre-selected.
4. `applyResumeImport` merges accepted items under the user's RLS client, stamps
   `source='resume_import'`, records `applied_row_id` per item, per-item failure
   isolated. Never deletes; never overwrites a non-empty field without an
   explicit CONFLICT choice; never downgrades.

## Invariants preserved

- Career Profile still works with zero uploads — the entry point is a link, not
  a gate.
- Original file immutable (no UPDATE/DELETE storage policy).
- Re-import creates a **new** `resume_import` row; every prior résumé + import
  stays.
- AI output never reaches trusted data without a human Accept.
- Résumé text is untrusted (system-prompt isolation + structured output +
  re-validation + review gate).

## Failure cases

Invalid upload → inline error, no row. Storage upload fails after row insert →
row deleted. Provider 5xx → Inngest retries → `onFailure` → `failed` + Retry
button. Refused / malformed output → `NonRetriableError` → `failed`. Queue
unreachable (no Inngest) → résumé shows `Parse failed` with Retry. One item
fails to apply → `apply_error` on that item, others still apply.

## Testing

- Unit (`npm test`): `validation` (magic bytes, size, filename, encrypted),
  `normalize` (dates, urls, keys), `diff` (every classification, never-delete,
  never-downgrade, low-confidence), `resume-schema` (valid / bad / injection
  inert).
- DB (`npm run test:db`): own children allowed; B can't read/update/delete A's
  imports; composite FK rejects cross-tenant import/item (`23503`); anon sees
  none.
- `lib/resume/parse-pipeline.ts` + `apply.ts` are `server-only` → no unit layer
  (repo pattern; covered by db-tests + manual QA).

## Acceptance Criteria

- [x] Migration applied (remote + vendored, matching version); advisors clean.
- [x] Schema + RLS + composite FKs + Storage bucket/policies.
- [x] `lib/ai/`, `lib/resume/`, `inngest/`, `/api/inngest`, `/resumes` +
      review UI.
- [x] lint / typecheck / test / test:db / build green.
- [ ] **Runtime:** real PDF → parses via Inngest → reviewed → profile enriched;
      re-import destroys nothing. Needs Inngest running (`SUPABASE_SERVICE_ROLE_KEY`
      and a provider key — Gemini, D-025 — are already set).
- [ ] Human acceptance + `/remember`.

## Deploy-time follow-ups

1. `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY` once D-025 reverts),
   `SUPABASE_SERVICE_ROLE_KEY` (runtime), `INNGEST_EVENT_KEY` /
   `INNGEST_SIGNING_KEY` in Vercel Production + Preview.
2. Create the Inngest Cloud app, sync it to the deployed `/api/inngest`,
   separate Preview vs Production Inngest environments.
3. Local: `npx inngest-cli@latest dev` alongside `npm run dev`.

## Out of Scope

DOCX / other formats; OCR; tailored/generated résumés + PDF export (Phase 6/7);
job matching; multi-provider AI; re-link-an-item UI; résumé delete/versioning
UI; parse-cost accounting (Phase 13); completion notifications (Phase 12).
