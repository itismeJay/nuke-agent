# Nook — Build Guide (0% → 100%)

This is the execution contract for the project.

**Rule:** do not move to the next phase until the current phase's required **Done when** conditions are satisfied.

Use `/phase <number>` to work through a phase. Use `/remember` after accepted work so the checklist stays accurate.

**Product direction (2026-09-02):** Nook ships the **manual** application loop first
(Phases 0–8), then layers automation on top. See `DECISIONS.md` D-014…D-020 for the
reasoning. Three application modes, built in order:

| Mode | Meaning | Phase |
| --- | --- | --- |
| **Manual** | Nook prepares materials; user applies on the employer site, clicks "I Applied". | 8 — **first MVP** |
| **Assisted** | Nook fills the form in a Browserbase session, pauses on unknown/sensitive questions, user reviews and **submits**. | 10 |
| **Autonomous** | Nook finds → decides → fills → submits with the user offline. | Future Optional — postponed |

**Removed from the plan:** the old "Phase 17 — Production CI/CD on AWS". CI exists
today (Phase 0); deployment is GitHub Actions → Vercel (`CICD.md`, D-019). AWS
infrastructure is not in the near-term plan.

---

# Phase 0 — Engineering Foundation

**Status:** COMPLETE (formatter + deeper test layers tracked in TECH_DEBT, not blocking)

## Goal

Create a stable development baseline before product features.

## Checklist

- [x] Next.js + TypeScript project runs locally
- [x] strict TypeScript configuration
- [x] Tailwind configured
- [x] shadcn/ui configured where used (base-ui variant, `components.json`)
- [x] light/dark design tokens (`app/globals.css` + `next-themes`)
- [x] environment files ignored from git
- [x] `.env.example` documented
- [ ] formatting configured (ESLint only; no Prettier) — TECH_DEBT TD-002
- [x] lint configured
- [x] test runner configured (Vitest, unit layer; `CICD.md` → Test Strategy)
- [x] production build command works
- [x] base module/folder structure established (`lib/`, `components/`, `app/(auth)`, `app/(app)`, `supabase/`)
- [x] Git repository initialized
- [x] basic GitHub CI for install/lint/typecheck/test/build (`.github/workflows/ci.yml`)
- [x] secret scanning / dependency security baseline (gitleaks + `npm audit` + CodeQL; `dependabot.yml`; push protection on — Dependabot *alerts* still to enable)
- [x] Actions-controlled Vercel deploy pipeline, inert until `DEPLOY_ENABLED=true` (`CICD.md`)
- [x] README explains local setup

## Done when

A fresh clone can install dependencies and run the application, tests/checks, and production build without hidden local steps. ✅

---

# Phase 1 — Database, Authentication & User Isolation

**Status:** COMPLETE (2026-09-02)

Everything after this phase assumes authenticated `user_id` ownership and trustworthy tenant isolation.

## Database

- [x] Multi-tenant schema applied to Supabase (`lemtlbepgrkltkmjbmqy`); migrations vendored in `supabase/migrations/`
- [x] Required tables created (11 public tables verified via MCP `list_tables`)
- [x] `user_id` ownership on every user-owned record
- [x] RLS verified enabled, not merely migrated (`pg_policies` audit + live PostgREST test)
- [x] Every RLS policy reviewed for correct scoping (`user_id = (select auth.uid())`, `to authenticated`; `job` = shared read)
- [x] Indexes for common ownership lookups (`*_user_id_idx`, `*_profile_id_idx`, `job_analysis (user_id, status)`)
- [x] **Cross-tenant relational integrity** — child FKs carry `user_id` and reference composite `(id, user_id)` on the parent (`20260902101500_tenant_scoped_child_fks`; D-018). Covers `experience`, `project`, `skill`, `education`, `master_resume`, `application`.

## Supabase clients

- [x] User-session-scoped server client (`lib/supabase/server.ts`); browser client (`lib/supabase/client.ts`)
- [x] Cookie/session JWT via `@supabase/ssr` + `middleware.ts` refresh
- [x] RLS confirmed to apply for normal app requests (real user JWT via PostgREST returns only own rows)
- [x] Admin/service client (`lib/supabase/admin.ts`) — `import "server-only"`, throws unless `SUPABASE_SERVICE_ROLE_KEY` set (not set anywhere); allowed callers documented as "none yet"

## Authentication

- [x] Email/password (verified `email: true`; sign up / in / out end to end)
- [x] Email confirmation decision: **off** for now (`mailer_autoconfirm: true`; D-013 — revisit before production)
- [x] Google OAuth — provider enabled, redirect URI configured; **verified end to end**: a real Google identity (`rbjay2005@gmail.com`, `provider: google`) exists with base rows seeded from Google metadata and a repeat sign-in recorded
- [x] Supabase redirect URLs for local (production URLs added at deploy time — `CICD.md` → Vercel config)
- [x] Sign Up / Sign In / Sign Out; forgot + reset password via `/auth/callback`
- [x] Inline validation, loading states, non-enumerating auth errors (`lib/auth/errors.ts`)
- [x] Password reset revokes other sessions (`signOut({ scope: "others" })`)
- [x] `?error=` codes mapped to fixed copy, never reflected verbatim (`authErrorMessage`)

## Account initialization

- [x] Signup trigger `handle_new_user` seeds `profile` + `agent_settings` (idempotent, `on conflict do nothing`)
- [x] App-side `ensureAccountInitialized` fallback — runs only when the profile row is missing (not on every request)
- [x] Partial-initialization failure handled without hard-failing the request

## Route protection

- [x] `middleware.ts` guards `/dashboard /profile /jobs /applications /resumes /settings`
- [x] Signed-out → `/sign-in?redirectTo=…` (verified `307`); signed-in bounced off auth pages
- [x] Layouts also call `requireUser()` (defence in depth)
- [x] `redirectTo` validated same-origin only (`lib/auth/redirect.ts`, unit-tested)

## Security verification

- [x] Two test users; User B could not SELECT / UPDATE / DELETE User A's rows
- [x] `anon` sees nothing; WITH CHECK blocks inserting rows owned by another user
- [x] Composite-FK check: User B `user_id` + User A `profile_id` → `foreign_key_violation` (verified against the live DB)
- [x] Service/admin key is server-only and unset

## UI

- [x] Marketing landing; polished split-layout auth screens (`/ui-review` pass done)
- [x] Authenticated app shell — sidebar + mobile drawer + user menu (shadcn `sidebar` system)
- [x] Light/dark themes usable (`next-themes` system default + toggle)

## Done when

Sign up with email/password **and** Google, land on a protected dashboard, signed-out users redirected, base rows exist, two test users proven isolated by RLS **and** by composite FK. ✅

**Deploy-time follow-ups (not Phase 1 blockers):** production `NEXT_PUBLIC_SITE_URL`, Supabase Auth redirect allowlist for the prod domain, re-enable email confirmation (D-013).

---

# Phase 2 — Career Profile

**Status:** NOT STARTED — **next phase**

## Goal

Build the central trusted Career Profile. It must work even if the user never uploads a resume (D-020).

## Data (review actual schema before creating duplicates)

- [ ] profile / personal information (extend existing `profile`)
- [ ] experiences
- [ ] experience achievements
- [ ] canonical skills + user/profile skills (normalize; replace the current denormalized `skill.profile_id` shape)
- [ ] projects
- [ ] project skills
- [ ] education
- [ ] certifications
- [ ] career preferences
- [ ] reusable application answers
- [ ] provenance/source fields where useful (manual vs imported)

## Security

- [ ] RLS on every new user-owned table (`user_id = (select auth.uid())`, `to authenticated`)
- [ ] composite `(id, user_id)` FK pattern on every parent/child relationship (D-018)
- [ ] ownership + cross-tenant tests (see below)
- [ ] sensitive application answers handled explicitly (no fabrication downstream)

## UI

- [ ] `/profile` with editable sections: personal info, experience CRUD, achievements, skills, projects, education, certifications, career preferences, application answers
- [ ] profile completeness indicator
- [ ] manual edits always possible

## Domain behavior

- [ ] current employment supported (null end date)
- [ ] duplicate skills normalized / prevented
- [ ] project ↔ skill association
- [ ] partial profiles fully supported

## Tests

- [ ] User A parent + User A child → allowed
- [ ] User B parent + User B child → allowed
- [ ] User B child + User A parent → **rejected** (composite FK)
- [ ] User B SELECT / UPDATE / DELETE User A → rejected / invisible
- [ ] Zod validation on every Server Action boundary

## Done when

A user can accurately represent their complete professional background without uploading a resume, every private record is tenant-isolated, and cross-tenant child inserts are rejected by the database.

---

# Phase 3 — Master Resume Import, Re-import & Inngest Resume Processing

**Status:** NOT STARTED — introduces Inngest and Supabase Storage

## Goal

Use resumes to *enrich* the Career Profile through reviewed proposals. The PDF never becomes the source of truth (D-002, D-003).

## Storage

- [ ] private Supabase bucket for master resumes
- [ ] validated upload — size limit, MIME/type check (not extension alone), safe filename, ownership-scoped path
- [ ] authenticated / short-lived signed access
- [ ] original file immutable after upload

## Data

- [ ] `master_resume` metadata (extend existing table); primary-resume flag; parse state
- [ ] parse-run records; profile-import-run records

## Inngest (first use in the codebase — D-016)

- [ ] install + configure Inngest; expose the route handler; dev/prod env separation
- [ ] upload returns quickly, then emits a parse event
- [ ] parse workflow: extract text → constrained AI parse → Zod validation → store proposal → ready-for-review
- [ ] uncertainty represented, never fabricated (D-005 truth rule; §12–13 of the direction prompt)
- [ ] retry is idempotent

## Review / merge

- [ ] user sees extracted data vs current profile: NEW / CHANGED / UNCHANGED / CONFLICT
- [ ] accept / reject / edit per field; bulk "select recommended"
- [ ] merge only confirmed facts; never silently overwrite trusted manual data; never delete profile data because a resume omits it
- [ ] preserve richer/more precise existing data unless the user chooses otherwise
- [ ] re-import of a newer resume keeps old master resumes and import history

## Done when

A real resume uploads, parses asynchronously via Inngest, is reviewed field-by-field, and enriches the Career Profile while the original file stays unchanged. Re-importing a newer resume never destroys existing data.

---

# Phase 4 — Jobs, Companies, Manual Discovery & Saved Jobs

**Status:** NOT STARTED

## Goal

A correct normalized opportunity model — shared job entity, per-user state separate (D-017) — before any scheduled automation.

## Data

- [ ] `company`
- [ ] `job_source`
- [ ] `job` (normalize the existing shared table)
- [ ] `job_requirement`
- [ ] `job_skill`
- [ ] `saved_job` (`user_id`, `job_id`, `created_at` — no job duplication)
- [ ] deterministic job fingerprint; canonical URL / external ID where available

## Manual discovery

- [ ] role/location search UI + paste-a-URL import
- [ ] Brave Search integration for manual discovery (provider hierarchy: official ATS API → Brave → native HTTP → Scrapling fallback)
- [ ] platform-scoped queries (Greenhouse, Lever first; Workable, Wellfound later)
- [ ] normal HTTP fetch of a public job page → parser/normalizer
- [ ] duplicate detection (fingerprint / canonical URL / external ID); company normalization
- [ ] caching: reuse recently fetched results; configurable, documented TTL (not a copied 6h constant — §18)

## Pages

- [ ] `/jobs`, `/jobs/[id]`, `/saved-jobs` (reuse the same `JobCard`), `/companies/[id]`
- [ ] `JobCard` shows only reliably-available fields; salary only when explicit; skeleton / empty / error / responsive states
- [ ] Save toggles `saved_job`; "Apply" opens the original URL in a new tab

## Done when

A user can discover/import a real public job, view normalized company/job data, save it, see it on `/saved-jobs` with the same card, and repeated discovery does not create duplicate `job` rows.

---

# Phase 5 — Job Understanding & Deterministic Match Scoring

**Status:** NOT STARTED

## Goal

Explain how well a job fits the user's trusted profile. AI interprets the job; **deterministic code computes the authoritative score** (D-006).

## Job understanding

- [ ] structured AI extraction: required skills, preferred skills, responsibilities, experience requirement, seniority, education, location, work arrangement, job type, explicit salary, explicit authorization statements only
- [ ] schema (Zod) validation; treat the job description as untrusted input (§51 — no instruction-following from job text)
- [ ] never hallucinate absent requirements

## Matching

- [ ] `job_match` table: `user_id`, `job_id`, `profile_id`, `overall_score`, component scores, `algorithm_version`, explanation
- [ ] deterministic scoring algorithm; configurable + versioned weights (starting point: skills 35 / experience 25 / projects 15 / seniority 10 / location 10 / education 5 — review before changing)
- [ ] required vs preferred distinction; score bounds; same inputs + same version → same result
- [ ] AI explanation generated **separately** from the number
- [ ] handle malformed AI extraction gracefully

## UI

- [ ] match badge, component breakdown, strengths, missing requirements, required/preferred coverage
- [ ] dashboard recommendations

## Tests

- [ ] perfect / partial / missing-required / preference-mismatch / sparse-profile / malformed-AI / deterministic-repeat

## Done when

Every analyzed job shows a reproducible score and a useful explanation grounded in real profile/job data.

---

# Phase 6 — Truthful Resume Tailoring

**Status:** NOT STARTED

## Goal

Generate a job-specific resume using only supportable Career Profile facts (D-002, core truth rule §5).

## Data

- [ ] resume versions; resume changes; resume claims / provenance

## Pipeline

- [ ] load profile / job / match / optional master-resume context
- [ ] rank relevant experiences, achievements, projects, skills → content plan
- [ ] constrained AI rewrite → truth/provenance validation → **reject unsupported claims**
- [ ] compatibility analysis; persist a structured version
- [ ] long-running generation runs via Inngest (D-016)

## Compatibility (no "guaranteed ATS pass" claims)

- [ ] required/preferred keyword coverage, technical alignment, experience relevance, structure/readability heuristic

## UX

- [ ] "Tailor" action on a job; generation progress
- [ ] diff vs master/base; reasons for changes; provenance where useful

## Done when

Clicking Tailor produces a recognizable, job-relevant version of the user's resume and every factual claim traces to trusted career data.

---

# Phase 7 — PDF Export & Resume Center

**Status:** NOT STARTED

## Goal

Turn structured tailored resumes into usable immutable application artifacts.

## Rendering

- [ ] structured resume JSON → React/HTML template → Chromium PDF (Playwright or equivalent)
- [ ] ATS-readable, professional, predictable, text-based; stable typography

## Storage

- [ ] private generated-resumes bucket/path; immutable version ↔ file linkage; download via short-lived signed URL; correct job/company linkage

## UI — Resume Center (separate the two kinds)

- [ ] `/resumes` — **Master Resumes** (uploaded originals, filename, upload date, primary flag, parse/import status, view/download, upload newer)
- [ ] `/resumes` — **Tailored Resumes** (job, company, match, generated date, version, preview, download)
- [ ] `/resumes/[id]` — PDF preview, match/compatibility info, diff/provenance
- [ ] never auto-convert a tailored resume into a master resume

## Done when

For any tailored resume, the user retrieves a professional PDF whose DB version and file are permanently linked to the correct job context.

---

# Phase 8 — Manual Application Tracker — **FIRST MVP MILESTONE**

**Status:** NOT STARTED

## Goal

Ship the complete manual job-search system before any browser automation.

## Data

- [ ] `application` (`user_id`, `job_id`, `resume_version_id`, `job_match_id`, `mode`, `status`, `applied_at`, timestamps) — add `mode` enum `MANUAL` / `ASSISTED` (keep `auto` reserved only if justified; D-014)
- [ ] `application_event` (append-only history)
- [ ] snapshot foundation: `job_snapshot`, `match_snapshot`, `submitted_answer_snapshot`, exact resume version
- [ ] validated state machine: `SAVED` → `PREPARING` → `READY_TO_APPLY` → `NEEDS_PROFILE_INFO` → `APPLIED` → `SCREENING` → `ASSESSMENT` → `INTERVIEW` → `TECHNICAL_INTERVIEW` → `FINAL_INTERVIEW` → `OFFER` / `REJECTED` / `WITHDRAWN` / `CLOSED`
- [ ] unique `(user_id, job_id)` duplicate protection

## Flow

- [ ] job → tailored resume → `[Apply]` dialog → **[Apply Manually]** / [Automate Application] (latter shows honest "coming soon" until Phase 10)
- [ ] Apply Manually: open employer URL in a new tab → user submits → returns → **[I Applied]**
- [ ] on "I Applied", persist immutable snapshots + append `APPLIED` event
- [ ] manual status updates append events; history never rewritten by later profile/job/algorithm changes

## UI

- [ ] `/applications` — table + Kanban + filters
- [ ] `/applications/[id]` — resume used, score snapshots, timeline, notes, company history

## Done when

A user can run Nook as a full manual system: **profile → job → match → tailored PDF → apply → track.** This is the first real MVP.

---

# Phase 9 — Scheduled Job Discovery (Inngest)

**Status:** NOT STARTED — post-MVP

## Goal

Find opportunities while the user is offline. **Discovery only — no application submission.**

## Infrastructure

- [ ] Inngest scheduled function; dev/prod environment separation; run records / metrics

## Workflow

- [ ] schedule → load career preferences → build provider queries → discover (official ATS API → Brave → native HTTP → Scrapling fallback) → normalize → fingerprint → dedupe → store → analyze → match → notify strong matches
- [ ] per-source failure isolation; retries; rate/concurrency limits; no duplicate notifications

## Done when

The user can close Nook and return to new, scored opportunities discovered automatically. The workflow **stops before** any application step.

---

# Phase 10 — Assisted Apply (Browserbase) + Guardrails

**Status:** NOT STARTED — post-MVP. Merges the old "Automation Settings & Guardrails" + "Assisted Apply". Autonomous submission is **not** in scope (Future Optional A).

## Guardrail configuration (the subset assisted apply needs)

- [ ] `agent_settings` extended: assisted-apply enabled toggle (off by default), allowed roles / locations, minimum salary, blocked companies, excluded keywords, unknown-question behavior, sensitive-answer review behavior
- [ ] **global server-side kill switch** for all browser automation
- [ ] config validated server-side; important changes audited
- [ ] enabling the toggle still cannot cause an autonomous submission

## Initial platform support

- [ ] Greenhouse + Lever only (D-015). Unsupported ATS → fall back to Manual Apply. No universal-support claims.

## Infrastructure

- [ ] Browserbase account/config; Stagehand where it earns its place
- [ ] `browser_session`, `agent_run`, `agent_step` records; store Browserbase session ID for debugging
- [ ] Inngest orchestration where durable waiting states are needed (D-016)

## Flow

- [ ] preconditions: user owns the application, URL valid, tailored resume exists, truth validation passed, required profile fields present
- [ ] open application → detect fields → map to trusted profile / approved answer library → fill known fields → upload the exact tailored PDF
- [ ] unknown question → `NEEDS_PROFILE_INFO` / `NEEDS_USER_INPUT`, surface the missing field in `/profile`, pause
- [ ] sensitive question (authorization, sponsorship, demographic, clearance, salary, relocation, availability, years of experience not backed by facts) → **user review**, never fabricated (§33–34)
- [ ] final review screen → **user explicitly clicks submit**
- [ ] store exact submitted answers + application event/result
- [ ] tasks executed one at a time to avoid conflicts / rate limits

## Failure cases

- [ ] CAPTCHA, auth wall, unsupported ATS, selector/form changes, upload failure, timeout, session cleanup — all degrade to Manual Apply cleanly

## Done when

Nook prepares several sandbox Greenhouse/Lever applications end to end, pauses safely on uncertainty, and only submits after explicit user confirmation.

---

# Phase 11 — Application Status Tracking

**Status:** NOT STARTED

## Goal

Close the lifecycle after submission. Manual updates first; email integration second.

## Integration

- [ ] Gmail/email integration; secure OAuth token handling; message ↔ application correlation

## Classification

- [ ] confirmation / screening / assessment / interview / technical / final / offer / rejection / other
- [ ] confidence threshold — high-confidence updates apply, ambiguous become suggestions
- [ ] every automated status change stores provenance; appends an event; notifies the user
- [ ] ambiguous messages never silently corrupt status/history

## Done when

High-confidence application emails safely update the tracker; ambiguous ones never corrupt it.

---

# Phase 12 — Notifications & Career Analytics

**Status:** NOT STARTED

## Notifications

- [ ] strong match, resume ready, application submitted, application failed, user input required, interview, offer, rejection, automation limit reached

## Analytics (computed from Postgres — no separate warehouse at this scale)

- [ ] totals: jobs discovered/saved, applications, screenings, assessments, interviews, offers
- [ ] rates: screening / interview / offer / rejection; conversion funnel discover → match → resume → apply → interview → offer
- [ ] averages: match score, resume compatibility
- [ ] breakdowns: role, location, source, company, resume-version performance
- [ ] no misleading causal claims

## Done when

Users understand what's happening in their search without watching individual workflows, and can spot real trends.

---

# Phase 13 — Billing & Usage Accounting

**Status:** NOT STARTED — **do not prioritize before Nook's real economics are measured (D-014 note, §41)**

## Measure first

- [ ] cost per Claude call, Brave search, Inngest run, Browserbase minute, resume generation, PDF compute, storage, notification — then design plans

## Stripe

- [ ] Checkout (no hardcoded price/plan IDs — pass amount, plan, interval, metadata); Customer Portal
- [ ] signed webhook verification; webhook idempotency; failed-payment handling
- [ ] tables: subscription plan, Stripe customer/subscription IDs, status, current period, plan limit, daily usage count, payment status, billing history

## Usage ledger

- [ ] AI tokens/cost, search requests, scraping jobs, browser minutes, resume generations, applications — reconcilable, not a single mutable counter

## Enforcement

- [ ] entitlement checks server-side, before the assisted-apply flow; usage incremented after each successful attempt

## Done when

Subscription/entitlement decisions are enforced server-side and usage can be reconciled.

---

# Phase 14 — Admin & Operations

**Status:** NOT STARTED

- [ ] real server-side role enforcement; least privilege; admin actions audited
- [ ] pages: dashboard, users, jobs/companies, sources, discovery runs, agent runs, failures, usage/cost, billing, audit, system settings
- [ ] operational data: source health, workflow failures, application success rate, AI/browser/search spend, active users, revenue where available

## Done when

An authorized operator can diagnose failures and understand platform health without casually bypassing user privacy.

---

# Phase 15 — Production Hardening, Observability & Security

**Status:** NOT STARTED

## Observability

- [ ] structured logs with request/workflow correlation IDs; deployment version; agent/browser run IDs
- [ ] Inngest run visibility; Browserbase session/debug links; external-provider failure + latency + estimated-cost metrics
- [ ] Sentry if deeper application error monitoring is justified
- [ ] never log passwords, tokens, service-role secrets, or sensitive application answers

## Security review

- [ ] RLS, storage policies, signed URLs, privileged-client boundaries, upload risks, SSRF, XSS, OAuth, webhook verification, rate limits, AI prompt injection, browser-session security, secret rotation, sensitive logging
- [ ] **RLS isolation test suite in CI** (`db-tests` job against a local Supabase stack) — the gap `CICD.md` names as the line between "preview" and "initial production"
- [ ] separate non-prod Supabase project for Preview
- [ ] re-enable email confirmation (D-013)

## Done when

Important failures are diagnosable from telemetry, and every major trust/security boundary has an explicit control.

---

# Phase 16 — Staging, Full E2E, Backup & Recovery

**Status:** NOT STARTED

## Environments

- [ ] local, staging, production

## E2E (Playwright vs the preview/staging URL)

- [ ] signup/login, career profile, resume upload/parse, job discovery/import, matching, tailored resume/PDF, manual application, assisted application on a mock/test ATS, status tracking, analytics
- [ ] **never** run destructive E2E against real employer applications

## Recovery

- [ ] database backup policy; storage recovery strategy; an actual restore exercise
- [ ] RPO / RTO defined; account/data deletion workflow; retention policy

## Done when

Critical customer journeys are tested in staging before production, and the team has demonstrated a real data restore.

---

# Future Optional A — Controlled Autonomous Auto Apply

**Status:** POSTPONED — build only after Assisted Apply (Phase 10) is proven reliable.

Nook runs while the user is offline: finds jobs → decides which deserve an application → generates resumes → opens application pages → fills forms → answers questions → **submits without the user present.**

Requirements when it is eventually built:

- rule engine every automatic application must pass: enabled + global kill switch + minimum score + allowed role/location + salary + company blacklist + excluded keywords + daily/weekly limits + not-already-applied + valid resume + truth validation + no unresolved sensitive answer
- deterministic idempotency key `autoapply:{userId}:{jobId}` + DB duplicate protection; concurrent-worker and retry-after-timeout tests; "submitted but response lost" handled explicitly
- supported ATS only; everything else falls back to assisted/manual
- exact submitted snapshot preserved

Do not build this infrastructure before it is required.

---

# Future Optional B — Scale When Metrics Justify It

**Status:** CONDITIONAL — never build speculatively.

Measure P95/P99 latency, queue depth, CPU/memory, DB saturation, browser concurrency, discovery/application throughput, provider cost, worker utilization.

Possible evolutions only against a measured bottleneck with a target metric, expected impact, and rollback plan: dedicated scraping/browser/PDF workers, Redis, SQS, pgvector, CDN, RDS/Aurora (if leaving Supabase), ALB/ASG/ECS, service extraction.

Every scaling change needs a measured bottleneck — there is no generic "done".
