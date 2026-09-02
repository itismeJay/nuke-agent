# Nook — Build Guide (0% → 100%)

This is the execution contract for the project.

**Rule:** do not move to the next phase until the current phase's required **Done when** conditions are satisfied.

Use:

`/phase <number>`

to work through a phase.

Use:

`/remember`

after accepted work so the checklist stays accurate.

---

# Phase 0 — Engineering Foundation

**Status:** COMPLETE / VERIFY IF REPOSITORY DIFFERS

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
- [ ] formatting configured (ESLint only; no Prettier)
- [x] lint configured
- [x] test runner configured (Vitest, unit layer; `docs/project/CICD.md` → Test Strategy)
- [x] production build command works
- [x] base module/folder structure established (`lib/`, `components/`, `app/(auth)`, `app/(app)`, `supabase/`)
- [x] Git repository initialized
- [x] basic GitHub CI for install/lint/typecheck/test/build (`.github/workflows/ci.yml`)
- [x] secret scanning / dependency security baseline (gitleaks + `npm audit` + CodeQL in CI; `dependabot.yml`; GitHub push protection on — Dependabot *alerts* still to enable)
- [x] README explains local setup

## Done when

A fresh clone can install dependencies and run the application, tests/checks, and production build without hidden local steps.

---

# Phase 1 — Database & Authentication

**Status:** SUBSTANTIALLY COMPLETE — email/password verified end to end; Google OAuth
configured and handshake-verified to Google's consent screen, full credential
round-trip pending the first real Google sign-in.

Everything after this phase assumes authenticated `user_id` ownership and trustworthy tenant isolation.

## Database

- [x] Run the initial multi-tenant migration against Supabase (4 migrations applied + vendored to `supabase/migrations/`)
- [x] Confirm required tables were created (11 public tables verified via MCP `list_tables`)
- [x] Confirm `user_id` ownership exists on user-owned records
- [x] Verify RLS is actually enabled, not merely that migration succeeded (`pg_policies` audit + live PostgREST test)
- [x] Review every RLS policy for correct authenticated-user scoping (`user_id = (select auth.uid())`, `to authenticated`; `job` = shared read)
- [x] Add indexes needed for common ownership lookups (`*_user_id_idx`, `*_profile_id_idx`, `job_analysis (user_id, status)`)

## Supabase clients

- [x] Create user-session-scoped server client (`lib/supabase/server.ts`)
- [x] Ensure cookie/session JWT is used (`@supabase/ssr` cookie adapter + `middleware.ts` refresh)
- [x] Confirm RLS applies for normal app requests (verified with a real user JWT via PostgREST)
- [x] Create admin/service client only if required (`lib/supabase/admin.ts` created but gated — throws unless `SUPABASE_SERVICE_ROLE_KEY` set; not needed this phase)
- [x] Ensure elevated client cannot be imported into client/UI code (`import "server-only"`)
- [x] Document exactly which trusted background operations may use elevated access (header of `admin.ts`: "none yet")

## Authentication

- [x] Enable email/password auth (on by default; verified `email: true`)
- [x] Decide whether email confirmation is required (decision: **not** required for now; `mailer_autoconfirm: true` verified — revisit before production)
- [x] Enable Google OAuth (`google: true` verified; provider enabled in Supabase)
- [x] Configure Google Cloud OAuth redirect URIs (`https://<ref>.supabase.co/auth/v1/callback`; `/authorize` reaches Google account chooser with no `redirect_uri_mismatch`)
- [x] Configure Supabase redirect URLs for local and production environments (local: Site URL + `http://localhost:3000/**`; production URLs still to add at deploy time)
- [x] Build Sign Up (`app/(auth)/sign-up`)
- [x] Build Sign In (`app/(auth)/sign-in`)
- [x] Build Sign Out (server action `signOut`; verified in browser)
- [x] Build forgot/reset password (`forgot-password`, `reset-password`, via `/auth/callback`)
- [x] Add inline validation (`lib/auth/actions.ts` field-level + client)
- [x] Add loading states (`useFormStatus` pending on submit buttons)
- [x] Add user-safe authentication errors (`friendlyAuthError` mapping; non-enumerating)

## Account initialization

- [x] On successful signup create required `profile` row (`handle_new_user` trigger; verified)
- [x] Create required `agent_settings` / automation defaults (verified: `enabled=false`, `min_match_score=75`, `daily_apply_limit=5`)
- [x] Initialization is idempotent (`on conflict do nothing` migration + `ensureAccountInitialized` upsert with `ignoreDuplicates`)
- [x] Partial initialization failure is handled safely (`ensureAccountInitialized` returns `{ok:false}` without hard-failing; re-run on every protected request)

## Route protection

- [x] Protect dashboard
- [x] Protect profile
- [x] Protect resumes
- [x] Protect jobs
- [x] Protect applications
- [x] Protect automation/settings (`/settings`)
- [x] Signed-out access redirects to login (verified: `307 → /sign-in?redirectTo=…`)
- [x] Signed-in users are redirected away from login/signup where appropriate (`middleware.ts` AUTH_PREFIXES)

## Security verification

- [x] Create Account A
- [x] Create Account B
- [x] Insert private data for Account A
- [x] Verify Account B cannot SELECT it (0 rows)
- [x] Verify Account B cannot UPDATE it (0 affected; A's row intact)
- [x] Verify Account B cannot DELETE it (0 affected)
- [x] Verify normal user client cannot bypass RLS (real JWT via PostgREST returns only own rows; `anon` sees nothing)
- [x] Verify service/admin key is server-only (`server-only` import; key not set at all)

## UI

- [x] Landing page matches Nook design direction (`app/page.tsx` + `app/(marketing)`)
- [x] Sign in page polished (split layout, `/ui-review` pass done)
- [x] Sign up page polished
- [x] Password reset states polished
- [x] Empty authenticated app shell exists (`app/(app)/layout.tsx`)
- [x] Sidebar/mobile navigation works (desktop verified in browser; mobile drawer built to the Sheet pattern, not screenshotted — tool renders desktop width only)
- [x] Light/dark themes remain usable (`next-themes` system default + toggle in user menu)

## Done when

You can sign up with email/password **and** Google, land on a protected dashboard, signed-out users are redirected to login, base account rows exist, and two test users are proven isolated by RLS.

**Remaining before this is fully closed:** a real Google account sign-in that lands
on `/dashboard` (verified only to Google's consent screen so far), and production
redirect URLs when a deploy target exists.

---

# Phase 2 — Career Profile

**Status:** NOT STARTED

## Goal

Build the central trusted Career Profile. It must work even if the user never uploads a resume.

## Data

- [ ] profile/personal information
- [ ] experiences
- [ ] experience achievements
- [ ] canonical skills
- [ ] user/profile skills
- [ ] projects
- [ ] project skills
- [ ] education
- [ ] certifications
- [ ] career preferences
- [ ] reusable application answers

## Security

- [ ] RLS on every user-owned table
- [ ] ownership tests
- [ ] child records cannot cross tenant boundaries
- [ ] sensitive application answers handled explicitly

## UI

- [ ] `/profile`
- [ ] personal information
- [ ] experience CRUD
- [ ] achievements
- [ ] skills
- [ ] projects
- [ ] education
- [ ] certifications
- [ ] career preferences
- [ ] application answers
- [ ] profile completeness indicator

## Domain behavior

- [ ] current employment supported
- [ ] duplicate skills normalized/prevented
- [ ] project ↔ skill association
- [ ] provenance/source fields supported where useful
- [ ] manual edits remain possible at all times

## Done when

A user can accurately represent their complete professional background without uploading a resume, and all private records are tenant-isolated.

---

# Phase 3 — Master Resume Intake & Parsing

**Status:** NOT STARTED

## Goal

Use resumes to enrich the Career Profile without making the PDF the source of truth.

## Storage

- [ ] private Supabase bucket
- [ ] validated PDF upload
- [ ] max file size
- [ ] safe storage paths using user ownership
- [ ] authenticated/signed access
- [ ] original file remains immutable

## Data

- [ ] master resume metadata
- [ ] parse-run records
- [ ] primary resume support
- [ ] parsing state

## Workflow

- [ ] upload returns quickly
- [ ] emit resume parsing event
- [ ] Inngest parse workflow
- [ ] text extraction
- [ ] structured AI parse
- [ ] Zod/schema validation
- [ ] uncertainty represented instead of fabricated data
- [ ] parse result stored
- [ ] retry supported

## Review / merge

- [ ] user sees extracted data
- [ ] compare with existing Career Profile
- [ ] accept/reject/edit values
- [ ] merge confirmed facts
- [ ] do not silently overwrite trusted manual data

## Done when

A real resume can be uploaded, parsed asynchronously, reviewed, and used to enrich the Career Profile while the original file remains unchanged.

---

# Phase 4 — Jobs & Companies / Manual Discovery

**Status:** NOT STARTED

## Goal

Create a correct normalized opportunity model before scheduled automation.

## Data

- [ ] companies
- [ ] job sources
- [ ] jobs
- [ ] requirements
- [ ] job skills
- [ ] saved jobs
- [ ] deterministic job fingerprint
- [ ] canonical URLs / external IDs where available

## Manual job import

- [ ] role/location search UI or URL import
- [ ] Brave Search integration for manual discovery
- [ ] targeted search queries
- [ ] normal HTTP fetch of public job page
- [ ] parser/normalizer
- [ ] duplicate detection
- [ ] company normalization
- [ ] insert/update safely

## Pages

- [ ] `/jobs`
- [ ] `/jobs/[id]`
- [ ] `/saved-jobs`
- [ ] `/companies/[id]`

## Done when

A user can discover/import a real public job, view normalized company/job data, save it, and repeated discovery does not create duplicate job records.

---

# Phase 5 — Job Analysis & Deterministic Match Scoring

**Status:** NOT STARTED

## Goal

Explain how well a job fits the user's trusted profile.

## Job understanding

- [ ] structured AI extraction of required skills
- [ ] preferred skills
- [ ] responsibilities
- [ ] experience requirements
- [ ] seniority
- [ ] education
- [ ] location/work arrangement
- [ ] salary when explicit
- [ ] authorization requirements only when explicit
- [ ] schema validation

## Matching

- [ ] deterministic scoring algorithm
- [ ] configurable/versioned weights
- [ ] required vs preferred distinction
- [ ] technical skills component
- [ ] experience component
- [ ] project component
- [ ] seniority component
- [ ] location/preferences component
- [ ] education component
- [ ] score bounds
- [ ] algorithm version stored
- [ ] AI explanation generated separately from score

## UI

- [ ] match badge
- [ ] component breakdown
- [ ] strengths
- [ ] missing requirements
- [ ] required coverage
- [ ] preferred coverage
- [ ] dashboard recommendations

## Tests

- [ ] perfect match
- [ ] partial match
- [ ] missing required requirement
- [ ] preference mismatch
- [ ] sparse profile
- [ ] malformed AI extraction
- [ ] deterministic repeated result

## Done when

Every analyzed job can display a reproducible match score and a useful explanation grounded in real profile/job information.

---

# Phase 6 — Truthful Resume Tailoring

**Status:** NOT STARTED

## Goal

Generate a job-specific resume using only supportable Career Profile facts.

## Data

- [ ] resume versions
- [ ] resume changes
- [ ] resume claims/provenance

## Pipeline

- [ ] load profile/job/match/master resume
- [ ] rank relevant experiences
- [ ] rank achievements
- [ ] rank projects
- [ ] rank skills
- [ ] create content plan
- [ ] constrained AI rewrite
- [ ] truth/provenance validation
- [ ] reject unsupported claims
- [ ] compatibility analysis
- [ ] persist structured version

## Compatibility

- [ ] required keyword coverage
- [ ] preferred keyword coverage
- [ ] technical alignment
- [ ] experience relevance
- [ ] structure/readability heuristic
- [ ] no "guaranteed ATS pass" claims

## UX

- [ ] Tailor action on job
- [ ] generation progress
- [ ] diff vs master/base content
- [ ] reasons for changes
- [ ] provenance where useful

## Done when

Clicking Tailor produces a recognizable, job-relevant version of the user's resume and every factual claim can be traced to trusted career data.

---

# Phase 7 — PDF Export & Resume Center

**Status:** NOT STARTED

## Goal

Turn structured tailored resumes into usable immutable application artifacts.

## Rendering

- [ ] professional ATS-readable template
- [ ] structured resume JSON → HTML/React
- [ ] PDF generation
- [ ] stable typography/layout
- [ ] no unnecessary parsing-hostile visual elements

## Storage

- [ ] private generated-resumes bucket/path
- [ ] immutable version references
- [ ] download via safe URL
- [ ] correct job/company linkage

## UI

- [ ] `/resumes`
- [ ] master resume list
- [ ] generated versions
- [ ] `/resumes/[id]`
- [ ] PDF preview
- [ ] match/compatibility information
- [ ] diff/provenance
- [ ] download button

## Done when

For any tailored resume, the user can retrieve a professional PDF whose database version and file are permanently linked to the correct job context.

---

# Phase 8 — Manual Application Tracker — MVP

**Status:** NOT STARTED

## Goal

Ship a useful product before browser automation.

## Data

- [ ] applications
- [ ] application events
- [ ] application answer snapshots foundation
- [ ] application mode enum
- [ ] validated application state machine
- [ ] unique user + job duplicate protection

## Flow

- [ ] choose tailored resume
- [ ] open/download application materials
- [ ] user applies manually
- [ ] "I Applied"
- [ ] save immutable snapshots
- [ ] append APPLIED event
- [ ] manual status updates

## UI

- [ ] `/applications`
- [ ] table
- [ ] Kanban
- [ ] filters
- [ ] `/applications/[id]`
- [ ] resume used
- [ ] score snapshots
- [ ] timeline
- [ ] notes
- [ ] company history

## Done when

A user can use Nook as a complete manual job-search system: profile → job → match → tailored PDF → apply → track.

**This is the first real MVP milestone.**

---

# Phase 9 — Inngest Scheduled Job Discovery

**Status:** NOT STARTED

## Goal

Find opportunities while the user is offline, but do not auto-apply yet.

## Infrastructure

- [ ] configure Inngest
- [ ] expose Inngest route
- [ ] scheduled discovery function
- [ ] development/production environment separation

## Discovery providers

Preferred order:

1. official/public ATS/job APIs
2. Brave Search
3. native HTTP extraction
4. Scrapling fallback only when necessary

## Workflow

- [ ] schedule
- [ ] load user preferences
- [ ] build queries
- [ ] discover jobs
- [ ] normalize
- [ ] fingerprint
- [ ] dedupe
- [ ] store
- [ ] analyze
- [ ] match
- [ ] notify strong matches

## Reliability

- [ ] per-source failure isolation
- [ ] retries
- [ ] rate/concurrency limits
- [ ] no duplicate notifications
- [ ] discovery run records/metrics

## Done when

The user can leave Nook closed and later return to new, scored opportunities discovered automatically.

---

# Phase 10 — Automation Settings & Guardrails

**Status:** NOT STARTED

## Goal

Create configuration before dangerous automation is connected.

## Settings

- [ ] job discovery toggle
- [ ] Auto Apply toggle OFF by default
- [ ] minimum match score
- [ ] daily application limit
- [ ] weekly application limit
- [ ] allowed roles
- [ ] allowed locations
- [ ] minimum salary
- [ ] blocked companies
- [ ] excluded keywords
- [ ] unknown question behavior
- [ ] sensitive answer review behavior

## Safety

- [ ] global server-side Auto Apply kill switch
- [ ] Auto Apply toggle does not submit anything yet
- [ ] configuration validated server-side
- [ ] audit important setting changes

## Done when

The user can precisely configure automation rules, but enabling the UI still cannot cause an autonomous submission.

---

# Phase 11 — Assisted Apply (Browserbase)

**Status:** NOT STARTED

## Goal

Prepare browser applications while the user controls final submission.

## Initial support

Start narrow:

- Greenhouse
- Lever

Do not claim generic support for every ATS.

## Infrastructure

- [ ] Browserbase account/config
- [ ] browser session records
- [ ] agent run records
- [ ] agent step records
- [ ] Stagehand/control abstraction if justified

## Precondition checks

- [ ] user owns application
- [ ] job/application URL valid
- [ ] tailored resume exists
- [ ] truth validation passed
- [ ] required user profile fields exist

## Flow

- [ ] open application
- [ ] navigate known steps
- [ ] fill verified fields
- [ ] upload exact tailored PDF
- [ ] use approved answer library
- [ ] unknown question → NEEDS_USER_INPUT
- [ ] sensitive question → user review
- [ ] show final application review
- [ ] user explicitly clicks submit
- [ ] store exact submitted answers
- [ ] store application event/result

## Failure cases

- [ ] CAPTCHA
- [ ] authentication requirement
- [ ] unsupported ATS
- [ ] selector/form changes
- [ ] file upload failure
- [ ] timeout
- [ ] session cleanup

## Done when

Nook can prepare several test/sandbox Greenhouse/Lever applications end-to-end, pause safely when uncertain, and only submit after explicit user confirmation.

---

# Phase 12 — Controlled Autonomous Auto Apply

**Status:** NOT STARTED

## Goal

Submit eligible applications automatically without duplicate or uncontrolled behavior.

## Rule engine

Every automatic application must pass relevant:

- [ ] Auto Apply enabled
- [ ] global kill switch enabled
- [ ] minimum score
- [ ] allowed role
- [ ] allowed location
- [ ] salary rule
- [ ] company blacklist
- [ ] excluded keywords
- [ ] daily limit
- [ ] weekly limit
- [ ] not already applied
- [ ] valid resume
- [ ] truth validation
- [ ] no unresolved sensitive answer

## Idempotency

- [ ] deterministic key `autoapply:{userId}:{jobId}`
- [ ] database duplicate protection
- [ ] concurrent-worker test
- [ ] retry-after-timeout behavior
- [ ] ambiguous "submitted but response lost" behavior designed explicitly

## Browser workflow

- [ ] assisted flow reused safely
- [ ] supported ATS only
- [ ] unsupported forms fall back to resume-ready/manual/assisted flow
- [ ] exact submitted snapshot preserved

## Done when

Auto Apply can be enabled for supported jobs and multiple retries/concurrent workers cannot cause duplicate submissions.

---

# Phase 13 — Automatic Application Status Tracking

**Status:** NOT STARTED

## Goal

Close the lifecycle after submission.

## Integration

- [ ] Gmail/email integration
- [ ] secure OAuth token handling
- [ ] message/application correlation

## Classification

- [ ] application confirmation
- [ ] screening
- [ ] assessment
- [ ] interview
- [ ] technical interview
- [ ] final interview
- [ ] offer
- [ ] rejection
- [ ] other

## Safety

- [ ] confidence threshold
- [ ] ambiguous classification becomes suggestion
- [ ] every automated status update stores provenance
- [ ] append application event
- [ ] notify user

## Done when

High-confidence application emails safely update the tracker and ambiguous messages never silently corrupt application status.

---

# Phase 14 — Notifications & Career Analytics

**Status:** NOT STARTED

## Notifications

- [ ] strong job match
- [ ] resume ready
- [ ] application submitted
- [ ] application failed
- [ ] user input required
- [ ] interview
- [ ] offer
- [ ] rejection
- [ ] automation limit reached

## Analytics

- [ ] total applications
- [ ] manual/assisted/auto breakdown
- [ ] screening rate
- [ ] interview rate
- [ ] offer rate
- [ ] rejection rate
- [ ] average match score
- [ ] average resume compatibility
- [ ] applications by role
- [ ] location
- [ ] source
- [ ] company
- [ ] resume version performance
- [ ] discovery → match → resume → apply → interview → offer funnel

## Done when

Users can understand what is happening in their search without constantly watching individual workflows and can identify meaningful trends without misleading causal claims.

---

# Phase 15 — Billing & Usage Accounting

**Status:** NOT STARTED

## Goal

Make the application financially operable as a SaaS.

## Stripe

- [ ] customer creation
- [ ] subscriptions
- [ ] plan state
- [ ] signed webhook verification
- [ ] webhook idempotency
- [ ] failed payment handling

## Usage ledger

Track relevant:

- [ ] AI tokens/cost
- [ ] search requests
- [ ] scraping jobs
- [ ] browser minutes
- [ ] resume generations
- [ ] applications

## Plans

Define after actual cost measurements.

Potential:

- Free
- Pro
- Autonomous

## Done when

Subscription/entitlement decisions are enforced server-side and usage can be reconciled rather than inferred from a single mutable credit counter.

---

# Phase 16 — Admin & Operations

**Status:** NOT STARTED

## Goal

Operate the product without granting uncontrolled access to private user content.

## Admin authorization

- [ ] real server-side role enforcement
- [ ] least privilege
- [ ] audit administrative actions

## Pages

- [ ] dashboard
- [ ] users
- [ ] jobs/companies
- [ ] sources
- [ ] discovery runs
- [ ] agent runs
- [ ] failures
- [ ] usage/cost
- [ ] billing
- [ ] audit
- [ ] system settings

## Operational data

- [ ] source health
- [ ] workflow failures
- [ ] application success rate
- [ ] AI/browser/search spend
- [ ] active users
- [ ] jobs/applications
- [ ] revenue where available

## Done when

An authorized operator can understand platform health and diagnose failures without casually bypassing user privacy boundaries.

---

# Phase 17 — Production CI/CD on AWS

**Status:** NOT STARTED

CI should already exist from Phase 0. This phase adds secure automated delivery.

## GitHub

- [ ] protected main branch
- [ ] required checks
- [ ] production environment
- [ ] deployment concurrency

## CI gates

- [ ] format
- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] integration tests
- [ ] secret scan
- [ ] dependency review
- [ ] CodeQL
- [ ] production build
- [ ] Docker build
- [ ] Trivy image scan

## AWS

- [ ] ECR
- [ ] EC2
- [ ] EC2 instance role
- [ ] Systems Manager
- [ ] Secrets Manager
- [ ] CloudWatch baseline
- [ ] GitHub OIDC provider
- [ ] least-privilege GitHub deploy role

## Deployment

- [ ] build immutable SHA-tagged image
- [ ] scan exact production image
- [ ] push ECR
- [ ] resolve digest
- [ ] deploy through SSM
- [ ] blue/green container slots
- [ ] internal health check
- [ ] switch Nginx
- [ ] external smoke test
- [ ] rollback on failure

## Security

- [ ] no permanent AWS credentials in GitHub
- [ ] no runtime secrets baked into image
- [ ] no `git pull && npm build` production deployment
- [ ] SSH is not primary deployment mechanism

## Done when

A merge to the approved production path can deploy a tested/scanned immutable artifact automatically, validate health, and rollback safely.

---

# Phase 18 — Observability & Security Hardening

**Status:** NOT STARTED

## Observability

- [ ] Sentry
- [ ] structured logs
- [ ] CloudWatch
- [ ] request/workflow correlation IDs
- [ ] deployment version
- [ ] agent/browser run identifiers
- [ ] external provider failure metrics
- [ ] latency/error metrics
- [ ] estimated cost metrics

## Security review

- [ ] RLS
- [ ] storage policies
- [ ] signed URLs
- [ ] privileged client boundaries
- [ ] upload risks
- [ ] SSRF
- [ ] XSS
- [ ] OAuth
- [ ] webhook verification
- [ ] rate limits
- [ ] AI prompt injection
- [ ] browser-session security
- [ ] secret rotation
- [ ] sensitive logging

## Done when

Important failures can be diagnosed from telemetry, and major trust/security boundaries have explicit controls rather than assumptions.

---

# Phase 19 — Staging, Full E2E, Backup & Recovery

**Status:** NOT STARTED

## Environments

- [ ] local
- [ ] staging
- [ ] production

## E2E

Automate safe critical journeys:

- [ ] signup/login
- [ ] Career Profile
- [ ] resume upload/parsing
- [ ] job discovery/import
- [ ] matching
- [ ] tailored resume/PDF
- [ ] manual application
- [ ] assisted application on mock/test ATS
- [ ] auto apply on mock/test ATS
- [ ] status tracking
- [ ] analytics

Never use destructive E2E automation against real employer applications.

## Recovery

- [ ] database backup policy
- [ ] storage recovery strategy
- [ ] actual restore exercise
- [ ] RPO defined
- [ ] RTO defined
- [ ] account/data deletion workflow
- [ ] retention policy

## Done when

Critical customer journeys are tested in staging before production and the team has successfully demonstrated restoration of important data.

---

# Phase 20 — Scale Only When Metrics Justify It

**Status:** CONDITIONAL

Do not automatically implement this phase.

Measure:

- P95/P99 latency
- queue depth
- CPU/memory
- database saturation
- browser concurrency
- discovery throughput
- application throughput
- provider cost
- worker utilization

Possible evolutions only when required:

- ALB
- Auto Scaling Group
- ECS/Fargate
- dedicated scraping workers
- dedicated browser/application workers
- dedicated PDF workers
- Redis
- SQS
- pgvector
- CDN
- RDS/Aurora if leaving Supabase
- service extraction

## Done when

There is no generic "done." Every scaling change must have a measured bottleneck, target metric, expected impact, and rollback plan.
