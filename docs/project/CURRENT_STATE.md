# Nook — Current State

_Last updated: 2026-09-01_

## Current Phase

Phase 1 — Database & Authentication

Status: SUBSTANTIALLY COMPLETE. Email/password auth works end to end. Google OAuth
is configured and the handshake is verified to Google's consent screen; the first
real Google sign-in still needs to be run through to `/dashboard`.

## What works

- Supabase project `nook-agent` (`lemtlbepgrkltkmjbmqy`, region `ap-northeast-1`):
  4 migrations applied, 11 public tables, RLS enabled + policy-audited, ownership
  indexes, `handle_new_user` signup trigger (idempotent). Security advisors clean.
  Migration SQL vendored to `supabase/migrations/`.
- Supabase clients: `lib/supabase/{client,server,middleware,admin}.ts`. Server/browser
  clients run under the user session JWT (RLS enforced). Admin client is `server-only`
  and gated — not needed yet.
- Auth: email/password sign up / in / out, forgot + reset password. Google OAuth
  button + `app/auth/callback/route.ts` (PKCE code exchange, seeds base rows).
  Email confirmation is OFF (`mailer_autoconfirm: true`).
- Route protection: `middleware.ts` → `lib/supabase/middleware.ts` guards
  `/dashboard /profile /jobs /applications /resumes /settings`; signed-out →
  `/sign-in?redirectTo=…`; signed-in bounced off auth pages. Layouts also call
  `requireUser()` (defence in depth).
- Account init: signup seeds `profile` + `agent_settings`; `ensureAccountInitialized`
  re-asserts it idempotently on every protected request.
- RLS isolation proven: two test users, User B could not SELECT/UPDATE/DELETE User
  A's rows; `anon` sees nothing; real-JWT PostgREST returns only own rows.
- UI: Nook design tokens (light/dark via `next-themes`), shadcn/base-ui primitives,
  marketing landing, split-layout auth screens, authenticated app shell with
  sidebar + mobile drawer + user menu. `npm run lint` + `npm run build` green.

## In progress / immediate next

- Run a real Google account sign-in through to `/dashboard` to close Phase 1's
  "Done when".
- Then Phase 2 — Career Profile.

## Blockers

- None blocking. Google end-to-end confirmation needs a human sign-in (owner's
  Google account).

## Active architecture

- Next.js 16 (App Router, Turbopack) modular monolith · React 19 · TS strict
- Tailwind v4 + shadcn/ui (base-ui variant) · `next-themes`
- Supabase Postgres + Auth + RLS (project `lemtlbepgrkltkmjbmqy`)
- `@supabase/ssr` for cookie-based sessions; `middleware.ts` (not `proxy.ts`, see
  DECISIONS D-012) refreshes them
- Inngest / Browserbase / AI providers: not yet introduced

## Deferred to later phases (not debt)

- Private Storage bucket (Phase 3), Inngest (Phase 9), service-role client wiring
  (whenever a trusted background job first needs it), production redirect URLs
  (at deploy time).

## Known gaps (Phase 0 leftovers)

- No test runner, no GitHub CI, no secret scanning, no Prettier. Tracked in
  BUILD_PLAN Phase 0 and TECH_DEBT TD-002.
