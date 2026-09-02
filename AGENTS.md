# Project Agent Instructions — Codex

This repository uses shared engineering/design workflows.

## Read first as relevant

Engineering:
- `.agent/ENGINEERING_PLAYBOOK.md`
- `docs/project/CURRENT_STATE.md`
- `docs/project/BUILD_PLAN.md`
- `docs/project/ARCHITECTURE.md`

Design:
- `docs/design/UI_SYSTEM.md`
- `docs/design/MOTION_SYSTEM.md`
- `docs/design/COMPONENT_PATTERNS.md`
- `docs/design/PAGE_PATTERNS.md`

## Workflow command mapping

When the user begins a request with one of these conventions, read and follow the matching workflow:

- `/init-project` → `.agent/workflows/init-project.md`
- `/grill-me` → `.agent/workflows/grill-me.md`
- `/plan` → `.agent/workflows/plan.md`
- `/phase` → `.agent/workflows/phase.md`
- `/feature` → `.agent/workflows/feature.md`
- `/review` → `.agent/workflows/review.md`
- `/verify` → `.agent/workflows/verify.md`
- `/debug` → `.agent/workflows/debug.md`
- `/remember` → `.agent/workflows/remember.md`
- `/status` → `.agent/workflows/status.md`
- `/adr` → `.agent/workflows/adr.md`
- `/ship` → `.agent/workflows/ship.md`
- `/ui` → `.agent/workflows/ui.md`
- `/ui-review` → `.agent/workflows/ui-review.md`
- `/capture-ui` → `.agent/workflows/capture-ui.md`

Treat the remaining text as `$ARGUMENTS`.

## Core behavior

- inspect before editing
- protect correctness/data/security before style
- do not invent requirements
- do not jump roadmap phases
- preserve working behavior during UI redesign
- use shadcn/ui as the default UI component library — prefer existing or newly installed shadcn components (`npx shadcn add`) over building custom primitives from scratch, unless the product requires behavior shadcn cannot reasonably provide
- screenshots are references, not a license to clone external branding
- design docs are the project's visual source of truth
- run relevant tests/checks after changes
- do not claim completion when required checks fail
- do not commit/merge/deploy unless explicitly requested

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
