# Nook — Intended Folder Structure

Do not restructure working code merely to match this diagram. Use it as the direction for new code.

```text
/
├── AGENTS.md
├── CLAUDE.md
│
├── .agent/
│   ├── ENGINEERING_PLAYBOOK.md
│   ├── COMMANDS.md
│   └── workflows/
│       ├── init-project.md
│       ├── grill-me.md
│       ├── plan.md
│       ├── phase.md
│       ├── feature.md
│       ├── review.md
│       ├── verify.md
│       ├── debug.md
│       ├── remember.md
│       ├── status.md
│       ├── adr.md
│       ├── ship.md
│       ├── ui.md
│       ├── ui-review.md
│       └── capture-ui.md
│
├── .claude/
│   └── skills/
│       └── <skill-name>/SKILL.md
│
├── app/
│   ├── (auth)/
│   ├── (app)/
│   ├── admin/
│   └── api/
│
├── modules/
│   ├── auth/
│   ├── profile/
│   ├── resume/
│   ├── companies/
│   ├── jobs/
│   ├── matching/
│   ├── applications/
│   ├── automation/
│   ├── agents/
│   ├── notifications/
│   ├── analytics/
│   ├── billing/
│   └── admin/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── browserbase/
│   ├── discovery/
│   ├── security/
│   └── logger/
│
├── inngest/
│   ├── client.ts
│   └── functions/
│
├── supabase/
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    ├── project/
    ├── design/
    │   ├── UI_SYSTEM.md
    │   ├── MOTION_SYSTEM.md
    │   ├── COMPONENT_PATTERNS.md
    │   ├── PAGE_PATTERNS.md
    │   └── references/
    ├── features/
    │   ├── active/
    │   └── completed/
    └── adr/
```

## Domain module rule

A module owns its business logic.

Create only the layers the module genuinely needs.

Do not add empty architecture ceremony.

## Shared code rule

Move code into shared areas only when it is genuinely cross-domain.

Do not turn `lib/` or `components/shared/` into dumping grounds.

## Design rule

The codebase is not the only design memory.

Stable visual rules belong under `docs/design/`.

When a page introduces a genuinely reusable accepted pattern, use `/capture-ui`.
