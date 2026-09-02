# nuke-agent

**Nook** — an AI Career Operating System. Build a structured Career Profile once;
Nook helps you discover → understand → match → prepare → validate → apply → track
→ learn on job opportunities. Product docs live in [`docs/project/`](docs/project);
`PROJECT_BRIEF.md` and `ARCHITECTURE.md` are the best starting points.

The package is named `nuke-agent`; the product is **Nook**.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict
- Tailwind CSS v4 + shadcn/ui (base-ui variant), tokens in `app/globals.css`
- Supabase — Postgres + Auth + row-level security
- `next-themes` for light/dark (system default)

## Local setup

A fresh clone needs Node 20+ and these steps:

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                   # http://localhost:3000
```

### Environment variables

`.env.local` (gitignored) — all values are in the Supabase dashboard under
**Project Settings → API** for the `nook-agent` project:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (`sb_publishable_…`) or legacy anon key. Public by design — RLS is what protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Leave blank until a trusted background job needs it (see `lib/supabase/admin.ts`). |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally. Used to build OAuth redirect URLs. |

### Supabase dashboard config (one-time, per environment)

- **Auth → Providers → Email**: "Confirm email" off (dev) or on (prod).
- **Auth → URL Configuration**: Site URL + `http://localhost:3000/**` in Redirect URLs.
- **Auth → Providers → Google**: enable, add a Google Cloud OAuth client
  (Client ID + Secret), and register Supabase's callback URL
  (`https://<ref>.supabase.co/auth/v1/callback`) in that Google client.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build (also runs tsc internally)
npm run start     # serve the production build
npm run lint      # ESLint (eslint-config-next)
npm run typecheck # next typegen && tsc --noEmit
npm test          # Vitest — unit tests (lib/**/*.test.ts)
```

Tests are **Vitest, unit layer only** for now (pure logic in `lib/`). The gates
that run in CI on every push/PR are lint, typecheck, test, build, plus gitleaks,
`npm audit`, and CodeQL — see [`docs/project/CICD.md`](docs/project/CICD.md).

## Database

Migration SQL is checked into [`supabase/migrations/`](supabase/migrations) as the
record of what has been applied to the remote project. See
[`supabase/README.md`](supabase/README.md). Generated types:
`lib/supabase/database.types.ts`.

## Layout

| Path | Purpose |
| --- | --- |
| `app/(marketing)` · `app/page.tsx` | Public landing |
| `app/(auth)` | Sign in / sign up / password reset |
| `app/(app)` | Authenticated shell + product pages (route-protected) |
| `app/auth/callback` | OAuth / email-link return handler |
| `lib/supabase` | Browser / server / admin clients + session proxy helper |
| `lib/auth` | Server actions, `requireUser`, account initialization |
| `proxy.ts` | Session refresh + route protection (Next 16 proxy convention) |
| `components/ui` | shadcn primitives |
| `docs/` | Product, design, and decision docs |

Path alias: `@/*` → repo root.
