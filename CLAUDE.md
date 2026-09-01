# Project Agent Instructions — Claude Code

This repository uses reusable engineering and design workflows plus project-specific documentation.

## Project knowledge

Read as needed:

### Engineering
- `.agent/ENGINEERING_PLAYBOOK.md`
- `docs/project/CURRENT_STATE.md`
- `docs/project/BUILD_PLAN.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/DECISIONS.md`
- `docs/project/FOLDER_STRUCTURE.md`
- `docs/project/TECH_DEBT.md`

### Product feature specs
- `docs/features/`

### Design
- `docs/design/UI_SYSTEM.md`
- `docs/design/MOTION_SYSTEM.md`
- `docs/design/COMPONENT_PATTERNS.md`
- `docs/design/PAGE_PATTERNS.md`
- `docs/design/references/README.md`

## Engineering workflow

For substantial product work:

1. `/grill-me <idea>`
2. `/plan <approved feature>`
3. `/feature <spec>` or `/phase <number>`
4. `/review`
5. `/verify`
6. human accepts work
7. `/remember`
8. `/ship`

For bugs:
`/debug`

For project context:
`/status`

For architecture decisions:
`/adr`

## UI workflow

For new/redesigned UI:

1. Provide screenshots/references when useful.
2. `/ui <page/component>`
3. `/ui-review <page/component>`
4. fix accepted findings
5. `/verify`
6. `/capture-ui <pattern>` when a reusable visual pattern was established
7. `/remember`

Screenshots are references.
The design files under `docs/design/` are the source of truth.

## Important

- inspect before editing
- do not jump ahead in `BUILD_PLAN.md`
- do not invent project history
- do not rewrite unrelated working code
- do not weaken tests/type safety
- preserve business/auth/data behavior during visual redesigns
- do not clone external SaaS branding or copyrighted visual assets
- reuse established Nook components and patterns before inventing new ones
