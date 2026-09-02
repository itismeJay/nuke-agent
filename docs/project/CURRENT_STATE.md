# Nook — Current State

_Last updated: 2026-09-02_

## Current Phase

**Phase 1 — Database, Authentication & User Isolation: COMPLETE.**
Next: **Phase 2 — Career Profile.**

Product direction was re-baselined on 2026-09-02: ship the **manual** application
loop first (Phases 0–8), layer Assisted Apply (Browserbase, Phase 10) and
Scheduled Discovery (Inngest, Phase 9) after the MVP, and move fully autonomous
Auto Apply to Future Optional. See `BUILD_PLAN.md` and `DECISIONS.md` D-014…D-020.

## What works (Implemented)

- **Supabase project** `nook-agent` (`lemtlbepgrkltkmjbmqy`, `ap-northeast-1`):
  5 migrations applied + vendored to `supabase/migrations/`, 11 public tables,
  RLS enabled + policy-audited, ownership indexes, idempotent `handle_new_user`
  signup trigger. Security advisors clean except the known
  leaked-password-protection warning (TECH_DEBT).
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
- **Engineering:** Vitest unit layer (25 tests: redirect safety, auth-error
  mapping, `cn`), `npm run typecheck`, GitHub Actions CI (lint / typecheck /
  test / build / gitleaks / `npm audit` / CodeQL), `dependabot.yml`,
  Actions-controlled Vercel deploy pipeline (inert until `DEPLOY_ENABLED=true`).
  Full design in `docs/project/CICD.md`.

## Planned (not yet in the repo)

- **Inngest** — selected durable-workflow system (D-016). Not installed. Enters
  the codebase in **Phase 3** for resume parsing. Do not describe it as
  implemented.
- **Supabase Storage** — private buckets for master resumes (Phase 3) and
  generated PDFs (Phase 7). Not created yet.
- **AI provider (Claude) abstraction** — `parseResume()` / `analyzeJob()` /
  `tailorResume()`. Phase 3+.
- **Brave Search** — manual job discovery, Phase 4.
- **Browserbase + Stagehand** — Assisted Apply, Phase 10. Not installed.
- **Stripe** — Phase 13, after cost measurement.
- Normalized Career Profile tables, shared Job/Company model, `job_match`,
  `application` + snapshots + events — Phases 2, 4, 5, 8.

## Blockers

- None. Phase 1 is closed.

## Active architecture

- Next.js 16 (App Router, Turbopack) modular monolith · React 19 · TS strict
- Tailwind v4 + shadcn/ui (base-ui variant) · `next-themes`
- Supabase Postgres + Auth + RLS (`lemtlbepgrkltkmjbmqy`)
- `@supabase/ssr` cookie sessions; `middleware.ts` (not `proxy.ts`, D-012) refresh
- Deployment target: GitHub Actions → Vercel (D-019); **no AWS**
- Inngest / Browserbase / AI providers / Brave / Stripe: not yet introduced

## Deferred to later phases (not debt)

- Private Storage buckets (Phase 3 / 7), Inngest (Phase 3), service-role client
  wiring (whenever a trusted background job first needs it), production redirect
  URLs + separate non-prod Supabase project + re-enabling email confirmation
  (deploy time / Phase 15).

## Known gaps (tracked in TECH_DEBT)

- No Prettier (TD-002). No RLS/two-user isolation test in CI yet (TD-002) — the
  composite-FK invariant is enforced by the database but not asserted by an
  automated test.
- `lib/supabase/database.types.ts` regenerated by hand (TD-003).
- `middleware.ts` on the deprecated Next 16 convention (TD-001).
- `next build`/`next dev` appends a block to `AGENTS.md` (TD-004).

## Deploy-time checklist (before a public URL)

1. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL (Production + Preview scopes).
2. Add the prod domain to Supabase Auth → URL Configuration redirect allowlist,
   or Google OAuth breaks on the deployed site.
3. Decide on email confirmation (D-013) — currently anyone can sign up with an
   unverified address.
4. `CICD.md` → "Vercel configuration required" and "GitHub configuration
   required" for the full one-time setup.
