# Feature: Career Profile (Phase 2)

## Status
IN PROGRESS — code complete 2026-09-03, pending human acceptance + `/remember`.

## Problem

Everything after Phase 1 assumes a trusted, structured record of the user's
professional background. It must be usable with zero resume uploads (D-020) and
every private record must be tenant-isolated (D-018).

## Scope

- Schema: extend `profile` / `experience` / `project` / `education`; add
  `career_preferences`, `experience_achievement`, `profile_skill`,
  `project_skill`, `certification`, `application_answer`; reshape `skill` into a
  shared canonical catalog (D-021). `source` provenance + `updated_at` triggers.
- RLS "own rows" + composite `(id, user_id)` FKs on every new user-owned table.
- `/profile` — one page, anchored nav + completeness meter, full CRUD per
  section. Dashboard shows real completeness.
- Zod at every Server Action boundary; `user_id` / `profile_id` resolved
  server-side, never from the client.
- Supabase CLI + local stack; `tests/db/isolation.test.ts` + `db-tests` CI job.

## Out of Scope

Resume import / parsing (Phase 3), AI suggestions (Phase 3+), Storage buckets,
profile→match scoring (Phase 5), guided onboarding wizard, profile
history/versioning, profile export, skill-catalog moderation UI.

## Data / Contract Impact

Migration `20260902192324_career_profile_schema`. `profile.target_roles` /
`target_locations` dropped (moved to `career_preferences`); `project.tech_stack`
dropped (→ `project_skill`); `skill` loses `user_id` / `profile_id`, gains
`slug unique`. Types regenerated (`lib/supabase/database.types.ts`).

## Invariants

- Tenant isolation: RLS + composite FK (D-018). Proven by `npm run test:db`.
- `is_sensitive` application answers are stored + flagged; never auto-submitted
  or fabricated downstream (architecture invariant 7).
- Partial profiles are the normal state — no section blocks another.

## Failure Cases

Zod failure → inline field errors, no write. Supabase error → section-scoped
banner. Duplicate skill per profile → friendly "already added"
(`unique (profile_id, skill_id)`). Skill-catalog race → `unique(slug)` + upsert.

## Testing

- Unit: `completeness`, `skills` (slugify), every Zod schema.
- DB: `tests/db/isolation.test.ts` — own-children allowed; B can't
  read/update/delete A; composite FK rejects cross-tenant child (`23503`); RLS
  `WITH CHECK` blocks spoofed owner (`42501`); anon sees nothing.
- Gates: lint / typecheck / test / build / test:db, advisors clean.

## Acceptance Criteria

- [x] Every Phase 2 `BUILD_PLAN.md` checklist item DONE or explicitly deferred.
- [x] Migration applied (remote + vendored, matching version); advisors clean.
- [x] `/profile` full CRUD; completeness on page + dashboard.
- [x] RLS + composite FK on every new user-owned table.
- [x] `npm run test:db` green (7 tests) against the local Supabase stack
      (all 6 migrations replayed from scratch); `db-tests` CI job added.
- [x] Visual QA of `/profile` in the running app — personal info save,
      experience add ("Present" for a current role), skill add against the
      shared catalog, completeness meter 0 → 40%, validation on empty input.
- [ ] Human acceptance + `/remember`.

## Recommended Build Order

Done in this order: migration → CLI/local stack → types → Zod schemas → pure
logic + tests → queries + actions → db-tests + CI → `/profile` UI → dashboard
wiring → docs.
