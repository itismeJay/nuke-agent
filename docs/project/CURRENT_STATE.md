# Nook — Current State

_Last updated: 2026-09-03_

## Current Phase

**Phase 3 — Master Resume Import: CODE COMPLETE** (2026-09-03). All gates green
(lint / typecheck / test 79 / test:db 11 / build; `npm audit` clean; advisors
clean). **Runtime E2E is BLOCKED** — a real résumé parse needs Inngest running;
the phase is not COMPLETE and not human-accepted. Decisions D-022…D-025.
`SUPABASE_SERVICE_ROLE_KEY` (remote) is now set in `.env.local`. Extraction
temporarily runs on Gemini, not Anthropic (D-025, 2026-09-05) — no
`ANTHROPIC_API_KEY` needed until that reverts.

Phase 2 — Career Profile: COMPLETE (still pending human acceptance).

Product direction was re-baselined on 2026-09-02: ship the **manual** application
loop first (Phases 0–8), layer Assisted Apply (Browserbase, Phase 10) and
Scheduled Discovery (Inngest, Phase 9) after the MVP, and move fully autonomous
Auto Apply to Future Optional. See `BUILD_PLAN.md` and `DECISIONS.md` D-014…D-020.

## What works (Implemented)

- **Supabase project** `nook-agent` (`lemtlbepgrkltkmjbmqy`, `ap-northeast-1`):
  6 migrations applied + vendored to `supabase/migrations/`, 17 public tables,
  RLS enabled + policy-audited, ownership indexes, idempotent `handle_new_user`
  signup trigger. Security advisors clean except the known
  leaked-password-protection warning (TECH_DEBT). **Supabase CLI + local stack
  wired** (`supabase/config.toml`, `major_version = 17`); `npm run db:reset` /
  `db:start` / `gen:types`.
- **Career Profile (Phase 2)** — migration `20260902192324_career_profile_schema`:
  - `profile` extended (headline, phone, summary, `links` jsonb, `source`,
    `updated_at`); `target_roles`/`target_locations` moved out.
  - New tables: `career_preferences` (1:1), `experience_achievement`,
    `profile_skill`, `project_skill`, `certification`, `application_answer`.
    `experience` / `project` / `education` extended; `experience` & `project`
    gained composite `(id, user_id)` unique keys.
  - **`skill` is now a shared canonical catalog** (name / unique slug / category),
    authenticated read + append, ~100 seeded (D-021). `profile_skill` /
    `project_skill` join with proficiency + years.
  - `source` provenance (`manual` / `resume_import` / `ai_suggested` / `oauth`)
    on every user-authored table; `set_updated_at` triggers throughout.
  - RLS "own rows" on all 6 new user-owned tables; composite `(id, user_id)` FKs
    on every parent→child edge (D-018).
  - `/profile` — one page, anchored section nav + completeness meter, full CRUD
    for personal info, experience + achievements, skills, projects, education,
    certifications, preferences, application answers. `is_sensitive` answers
    flagged; nothing auto-submitted. Dashboard shows real completeness.
  - `lib/profile/` — `schemas.ts` (Zod at every action boundary), `actions.ts`
    (server actions; `user_id`/`profile_id` resolved server-side, never from the
    client), `queries.ts`, `completeness.ts`, `skills.ts`, `owner.ts`.
  - **Tenant-isolation test layer** — `tests/db/isolation.test.ts` +
    `npm run test:db` + `db-tests` CI job (TD-005 resolved). Verified live via
    SQL role simulation: cross-tenant child insert → `foreign_key_violation`;
    B cannot read/write A; anon sees nothing.
- **Cross-tenant relational integrity** (`20260902101500_tenant_scoped_child_fks`):
  `experience`, `project`, `skill`, `education`, `master_resume`, `application`
  now carry `user_id` in their FK to the parent and reference a composite
  `(id, user_id)` key — a child row pointing at another tenant's parent fails at
  the database. Verified live: `user_id` mismatch → `foreign_key_violation`.
- **Supabase clients:** `lib/supabase/{client,server,middleware,admin}.ts`.
  Server/browser clients run under the user JWT (RLS enforced). Admin client is
  `server-only`, throws unless `SUPABASE_SERVICE_ROLE_KEY` is set — it is set
  nowhere. Allowed elevated callers: none yet.
- **Auth:** email/password sign up / in / out, forgot + reset password, Google
  OAuth. `app/auth/callback/route.ts` does the PKCE exchange and seeds base rows.
  Email confirmation OFF (`mailer_autoconfirm`, D-013).
  - Password reset revokes other sessions (`signOut({ scope: "others" })`).
  - `?error=` is passed as a code and mapped to fixed copy (`authErrorMessage`),
    never reflected verbatim.
  - `redirectTo` validated same-origin-only in one place (`lib/auth/redirect.ts`,
    unit-tested).
- **Google OAuth is verified end to end:** a real Google identity
  (`rbjay2005@gmail.com`, `provider: google`) exists with `profile` +
  `agent_settings` seeded from Google metadata and a repeat sign-in recorded.
- **Route protection:** `middleware.ts` guards `/dashboard /profile /jobs
  /applications /resumes /settings`; signed-out → `/sign-in?redirectTo=…`
  (`307`), signed-in bounced off auth pages. Layouts also `requireUser()`.
- **Account init:** signup trigger seeds `profile` + `agent_settings`;
  `ensureAccountInitialized` re-asserts it **only when the profile row is
  missing** (no writes on the normal request path).
- **RLS isolation proven:** two test users — B could not SELECT/UPDATE/DELETE A's
  rows; `anon` sees nothing; real-JWT PostgREST returns only own rows.
- **UI:** Nook design tokens (light/dark via `next-themes`), shadcn/base-ui
  primitives, marketing landing, split-layout auth screens, authenticated app
  shell (sidebar + mobile drawer + user menu).
- **Engineering:** Vitest unit layer (54 tests: redirect/auth-error mapping,
  `cn`, profile completeness + skill slugify + every Zod schema) **plus a DB
  layer** (`npm run test:db`, 7 tenant-isolation tests against the local
  Supabase stack). `npm run typecheck`, GitHub Actions CI (lint / typecheck /
  test / **db-tests** / build / gitleaks / `npm audit` / CodeQL),
  `dependabot.yml`, Actions-controlled Vercel deploy pipeline (inert until
  `DEPLOY_ENABLED=true`) now gated on `db-tests` too. Full design in
  `docs/project/CICD.md`.

## Phase 3 — Résumé Import (code, 2026-09-03)

- **Migration `20260902202542_resume_import_schema`** (remote + vendored,
  matching version; advisors clean; replays on a fresh local stack):
  `master_resume` gains storage metadata + `is_primary` (partial unique) +
  `parse_status` state machine + `updated_at` + `unique (id, user_id)`;
  new `resume_import` / `resume_import_item` with RLS "own rows" + composite
  `(id, user_id)` FKs (D-018); private `master-resumes` Storage bucket +
  owner-scoped SELECT/INSERT object policies (no UPDATE/DELETE → immutable).
- **`lib/ai/`** — `claude.ts` (`extractResumeData`, lazy Anthropic client,
  `messages.parse` + `zodOutputFormat`, `claude-sonnet-5`), `resume-schema.ts`
  (Zod, every field nullable, `uncertain` flag), `prompts.ts` (versioned,
  injection-hardened). Only place the Anthropic SDK is imported (D-022).
- **`lib/resume/`** — `validation` (magic bytes / size / filename / encrypted),
  `normalize` (dates → ISO, urls, comparison keys), `match` + `diff` (versioned
  deterministic matcher + NEW/CHANGED/UNCHANGED/CONFLICT classifier),
  `profile-snapshot`, `parse-pipeline` (Inngest step units, `server-only`),
  `apply` (RLS-scoped merge, per-item failure isolation, field allow-list),
  `queries`, `actions` (upload / retry / setPrimary / discard / apply / view).
- **`inngest/`** — `client.ts` (`new Inngest({id:"nook"})` + typed
  `sendResumeUploaded`), `functions/parse-resume.ts` (`concurrency` 1/user,
  `idempotency`, `onFailure`). `app/api/inngest/route.ts` (`serve`).
  `middleware.ts` now excludes `/api`.
- **`lib/supabase/admin.ts`** — activated (D-024): the résumé parser is the sole
  documented caller. `SUPABASE_SERVICE_ROLE_KEY` still unset in `.env.local`.
- **`/resumes`** — real page: upload, master-résumé list with parse-status
  badges + Primary/Retry/Original actions, `router.refresh` poller while
  parsing. **`/resumes/import/[id]`** — field-by-field review grouped by
  classification, per-item accept/reject/edit, "select recommended", apply.
  "Import from résumé" links on `/profile` + dashboard.
- **New deps:** `@anthropic-ai/sdk`, `inngest`; `.npmrc` `legacy-peer-deps=true`
  (inngest's optional framework peers vs vitest's `vite`); `next.config.ts`
  `serverActions.bodySizeLimit`.
- **Tests:** +unit for `validation` / `normalize` / `diff` / `resume-schema`;
  +`test:db` for `resume_import` / `resume_import_item` RLS + composite FK +
  anon. `parse-pipeline` / `apply` are `server-only` (no unit layer, repo
  pattern).

## Planned (not yet in the repo)

- **AI provider abstraction beyond `lib/ai/`** — only if a second provider
  becomes real (D-022). `analyzeJob()` / `tailorResume()` land in Phase 5/6.
- **Supabase Storage** — private bucket for generated PDFs (Phase 7).
- **Brave Search** — manual job discovery, Phase 4.
- **Browserbase + Stagehand** — Assisted Apply, Phase 10. Not installed.
- **Stripe** — Phase 13, after cost measurement.
- Shared Job/Company model, `job_match`, `application` + snapshots + events —
  Phases 4, 5, 8.

## Blockers

- **Phase 3 runtime verification** needs Inngest running — an Inngest account
  (`INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` for the deployed runtime) or
  `npx inngest-cli dev` locally. `SUPABASE_SERVICE_ROLE_KEY` (remote) and a
  résumé-extraction provider (Gemini, D-025) are both already in `.env.local`.
  Until Inngest runs, the parse→review→merge round trip is unproven and
  Phase 3 stays code-complete, not COMPLETE.

## Active architecture

- Next.js 16 (App Router, Turbopack) modular monolith · React 19 · TS strict
- Tailwind v4 + shadcn/ui (base-ui variant) · `next-themes`
- Supabase Postgres + Auth + RLS (`lemtlbepgrkltkmjbmqy`); **Supabase CLI +
  local stack** (`supabase/config.toml`) for `db reset` / typegen / `test:db`
- `@supabase/ssr` cookie sessions; `middleware.ts` (not `proxy.ts`, D-012) refresh
- `zod` for Server Action input validation (added Phase 2)
- **Inngest** durable workflows (D-016/D-023) — résumé parsing; `/api/inngest`
- **`@anthropic-ai/sdk`** — résumé extraction, isolated to `lib/ai/` (D-022);
  currently dormant — extraction runs on `@google/genai` (Gemini) instead,
  temporarily, until Anthropic billing is set up (D-025)
- **Supabase Storage** — private `master-resumes` bucket (D-024 admin client)
- Deployment target: GitHub Actions → Vercel (D-019); **no AWS**
- Browserbase / Brave / Stripe: not yet introduced

## Deferred to later phases (not debt)

- Generated-PDF Storage bucket (Phase 7), production redirect URLs + separate
  non-prod Supabase project + re-enabling email confirmation (deploy time /
  Phase 15).

## Known gaps (tracked in TECH_DEBT)

- No Prettier (TD-002).
- Tenant-isolation tests exist (`tests/db/isolation.test.ts`, `db-tests` CI job,
  TD-005 resolved) but no CI check that `database.types.ts` matches the schema
  (TD-003 mostly resolved — `npm run gen:types` script exists).
- `application.mode` enum still `('manual','auto')` — rework in Phase 8 (TD-006).
- `middleware.ts` on the deprecated Next 16 convention (TD-001).
- `next build`/`next dev` appends a block to `AGENTS.md` (TD-004).
- `.npmrc` `legacy-peer-deps=true` — inngest@4's optional framework peers vs
  vitest's `vite` (TD-007).

## Deploy-time checklist (before a public URL)

1. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL (Production + Preview scopes).
2. Add the prod domain to Supabase Auth → URL Configuration redirect allowlist,
   or Google OAuth breaks on the deployed site.
3. Decide on email confirmation (D-013) — currently anyone can sign up with an
   unverified address.
4. **Phase 3:** `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY` once D-025 reverts),
   `SUPABASE_SERVICE_ROLE_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` in
   Vercel Production + Preview; create the Inngest Cloud app and sync it to
   `/api/inngest` (Preview vs Production environments).
5. `CICD.md` → "Vercel configuration required" and "GitHub configuration
   required" for the full one-time setup.
