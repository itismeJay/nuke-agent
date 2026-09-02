# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Nook** — an "AI Career Operating System". A user builds a structured Career Profile once; Nook then helps them discover → understand → match → prepare → validate → apply → track → learn on job opportunities. See `docs/project/PROJECT_BRIEF.md`.

The product name in the code/package is `nuke-agent`; the product name in the docs is `Nook`. They refer to the same thing.

## Commands

```bash
npm run dev      # Next.js dev server (localhost:3000)
npm run build    # production build — also the de facto typecheck (tsc --noEmit runs via next build)
npm run start    # serve the production build
npm run lint     # ESLint (eslint-config-next: core-web-vitals + typescript)
npm run typecheck # next typegen && tsc --noEmit
npm test         # Vitest — unit tests only (lib/**/*.test.ts)
```

Test runner is **Vitest**, unit layer only (pure logic in `lib/`). Component,
integration, and RLS tests are not set up yet — see `docs/project/CICD.md` →
Test Strategy. `/verify` gates that exist today: `npm run lint`,
`npm run typecheck`, `npm test`, `npm run build`.

CI/CD: GitHub Actions (`.github/workflows/ci.yml`, `codeql.yml`) runs those
gates plus gitleaks + `npm audit` + CodeQL on every push/PR; deploy to Vercel is
Actions-controlled and gated on the pipeline (`docs/project/CICD.md`). Deploy
jobs stay inert until the repo variable `DEPLOY_ENABLED=true` and the `VERCEL_*`
secrets are set.

Path alias: `@/*` maps to the repo root (`tsconfig.json`), so `@/lib/...`, `@/components/...`, `@/modules/...`.

## Stack

- Next.js **16** (App Router), React **19**, TypeScript strict mode
- Tailwind CSS **v4** (via `@tailwindcss/postcss`; config lives in `app/globals.css`, not a `tailwind.config.js`)
- Geist / Geist Mono fonts wired through `next/font` in `app/layout.tsx`

## Current state of the codebase vs. the plan

The repo is currently a **fresh create-next-app scaffold** — only `app/` (layout + placeholder home page) exists. `app/layout.tsx` still has the default "Create Next App" metadata.

`docs/project/FOLDER_STRUCTURE.md` describes the *intended* layout (`modules/`, `lib/`, `components/`, `inngest/`, `supabase/migrations/`, `tests/`). **None of those directories exist yet.** Treat that file as direction for new code, not a description of reality. Do not scaffold empty directories to match it.

Roadmap is in `docs/project/BUILD_PLAN.md` (Phases 0–19). Phase 0 (Engineering Foundation) is mostly done; **Phase 1 (Database & Authentication) is in progress** — Supabase multi-tenant schema, RLS, email/password + Google OAuth. `docs/project/CURRENT_STATE.md` is the live snapshot; `docs/project/logs/YYYY-MM-DD.md` are dated checkpoints written by `/remember`.

## Intended architecture (from `docs/project/ARCHITECTURE.md`)

Modular monolith. Next.js owns UI and synchronous server behavior; domain logic lives in per-domain `modules/`. Supabase = Postgres + Auth + RLS + private Storage. Inngest = durable/scheduled/retryable background workflows (nothing long-running in an HTTP request). Deterministic code (not AI) computes authoritative match scores; AI only parses/rewrites constrained unstructured content. Browserbase drives interactive application submission.

Do **not** introduce microservices, Redis, Kafka, Kubernetes, or a second database without a concrete operational requirement (see `docs/project/DECISIONS.md`).

### Critical invariants to preserve (full list in `ARCHITECTURE.md`)

- One user can never read another user's private data (enforce with RLS server-side, not just UI).
- Master resumes are immutable; tailoring produces new versioned artifacts.
- Generated resume claims must trace to trusted profile facts — never fabricate professional facts or sensitive application answers.
- Application history is append-only; historical snapshots never change.
- Retries must be idempotent — never cause a duplicate job application.
- Auto Apply requires explicit user rules and a global kill switch.
- Secrets never reach client code.

## Workflows

This repo drives work through workflow files in `.agent/workflows/`, exposed as slash commands (skills in `.claude/skills/`, mirrored for Codex in `AGENTS.md`). A command's text after the name is `$ARGUMENTS`. Command reference: `.agent/COMMANDS.md`. Reusable engineering method: `.agent/ENGINEERING_PLAYBOOK.md`.

Product work: `/grill-me` → `/plan` → `/feature` or `/phase <n>` → `/review` → `/verify` → (human accepts) → `/remember` → `/ship`

UI work: (optional reference screenshots) → `/ui` → `/ui-review` → fix → `/verify` → `/capture-ui` (if a reusable pattern emerged) → `/remember`

Bugs: `/debug` → fix → `/verify` → `/remember`

Architecture decisions: `/adr`. Project status: `/status`.

`/remember` and `/ship` never create a git commit unless explicitly asked.

Some `.claude/skills/` are vendored from an external repo and pinned in `skills-lock.json` — edit the vendored `SKILL.md` files with care.

## Design system

`docs/design/` is the source of truth for visual rules — `UI_SYSTEM.md`, `MOTION_SYSTEM.md`, `COMPONENT_PATTERNS.md`, `PAGE_PATTERNS.md`. Reference screenshots are references only; they are not a license to clone external SaaS branding or copyrighted assets. Reuse established components/patterns before inventing new ones. Preserve business/auth/data behavior during any visual redesign.

## Frontend / UI Rules

- Use shadcn/ui as the **default component library** for all UI work. (This repo uses the shadcn Base UI variant — `components.json`, primitives under `components/ui/`.)
- Prefer existing shadcn/ui components over building custom primitives from scratch.
- Before creating a new button, input, dialog, dropdown, sheet, tabs, badge, card, tooltip, table, form control, or similar primitive, check whether shadcn/ui already provides an appropriate component — first in `components/ui/`, then via `npx shadcn add <name>`.
- Extend or compose shadcn/ui components when needed instead of duplicating their functionality.
- Only create a custom component when:
  - shadcn/ui does not provide the required primitive,
  - the custom behavior is product-specific,
  - or composing existing shadcn/ui components would create unnecessary complexity.
- Preserve the accessibility behavior of the underlying shadcn / Base UI primitives.
- Do not replace working shadcn/ui components with custom implementations without a clear reason.

## House rules

- Inspect relevant code, migrations, types, and authorization policies before editing.
- Do not jump ahead of `BUILD_PLAN.md` — implement the current phase only.
- Do not invent project history or requirements; update `docs/project/` only from accepted work.
- Make the smallest coherent change; don't rewrite unrelated working code.
- Don't weaken tests or type safety.
- Never claim lint/build/tests passed unless they actually ran successfully.
- Don't commit, merge, or deploy unless explicitly asked.
