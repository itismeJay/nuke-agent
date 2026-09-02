# Nook — Engineering Decisions

## D-001 — Modular monolith first
**Status:** Accepted

Keep domains separated in code without introducing network microservices before scale/runtime needs justify them.

## D-002 — Career Profile is the source of truth
**Status:** Accepted

Structured verified career data is authoritative. Resumes are not the authoritative data model.

## D-003 — Master resumes are immutable
**Status:** Accepted

Tailoring creates new versioned artifacts.

## D-004 — Supabase for initial database/auth/storage
**Status:** Accepted

Use PostgreSQL + Auth + RLS + private storage to reduce initial operational burden while preserving relational semantics.

## D-005 — Inngest for durable background work
**Status:** Accepted

Scheduled, long-running, retryable, multi-step work should not depend on ordinary HTTP request lifetimes.

## D-006 — Match scoring is deterministic
**Status:** Accepted

AI extracts requirements/explanations. Versioned deterministic code calculates authoritative scores.

## D-007 — Simple extraction first
**Status:** Accepted

Use official APIs/native HTTP before Scrapling/browser extraction.

## D-008 — Browserbase for interactive application execution
**Status:** Accepted

Browser infrastructure is primarily for navigation/forms/uploads/submission, not routine discovery.

## D-009 — Immutable deployment artifacts
**Status:** Accepted

Production should deploy tested/scanned Docker artifacts, not build source on the server.

## D-010 — GitHub OIDC for AWS
**Status:** Accepted

Use temporary AWS credentials rather than permanent GitHub-stored AWS access keys.

## D-011 — shadcn/ui (base-ui variant) is the default component library
**Status:** Accepted (2026-09-01)

Component primitives come from shadcn's `base-nova` style over `@base-ui/react`,
tracked in `components.json`. Nook's semantic design tokens are mapped onto
shadcn's token names in `app/globals.css` so the design system stays the source
of truth. Theming is `next-themes` with `attribute="class"` and `defaultTheme="system"`.

shadcn/ui is the **default** for all UI work — prefer an existing component in
`components/ui/`, then `npx shadcn add <name>`, and only build a custom primitive
when shadcn cannot reasonably provide the behavior or it is genuinely
product-specific. This rule is enforced in `CLAUDE.md`, `docs/design/UI_SYSTEM.md`,
`.agent/workflows/ui.md`, and `AGENTS.md`. The app shell uses the shadcn
`sidebar` system; auth forms use `field`; status uses `alert` / `empty`.

## D-012 — Keep the `middleware.ts` convention, not Next 16 `proxy.ts`
**Status:** Accepted (2026-09-01), revisit on Next upgrade

Next 16 renamed the middleware convention to `proxy.ts` and warns on `middleware.ts`.
`proxy.ts` throws a phantom "missing expected function export" error in Turbopack
dev on 16.3.4 even with a correct `export function proxy`, while `middleware.ts`
works in both dev and production build. Staying on `middleware.ts` (a warning, not
an error) until the `proxy` dev path is fixed. See TECH_DEBT TD-001.

## D-013 — Email confirmation disabled in development
**Status:** Accepted for now (2026-09-01), MUST revisit before production

`mailer_autoconfirm` is on (Supabase "Confirm email" off) so email/password signup
lands straight on the dashboard without a mail round-trip. This is a development
convenience. Re-enable confirmation before any production launch and verify the
`/auth/callback` token-exchange path handles the confirmation link.

## D-014 — Manual Apply is the first MVP; automation is layered on after
**Status:** Accepted (2026-09-02)

The first shippable product is the full **manual** loop: profile → job → match →
truthful tailored resume → PDF → user applies on the employer site → "I Applied"
→ tracked. This must work end to end (Phase 8) before browser automation becomes
a dependency of anything.

Three distinct application capabilities, built in order:

| Mode | Meaning | Phase |
| --- | --- | --- |
| **Manual** | Nook prepares materials; user applies on the employer site and marks "I Applied". | 8 (first MVP) |
| **Assisted** | Nook drives a Browserbase session to fill the form; **pauses on unknown/sensitive questions**; user reviews and **explicitly submits**. | 10 |
| **Autonomous** | Nook finds, decides, fills and submits while the user is offline. | Future Optional — postponed |

Supersedes the old BUILD_PLAN framing where autonomous Auto Apply (old Phase 12)
was a numbered milestone.

## D-015 — Browserbase stays in the architecture, scoped to user-initiated Assisted Apply
**Status:** Accepted (2026-09-02)

Browserbase + Stagehand (where it earns its place) remain the browser-automation
layer. Their current purpose is **user-present, user-submitted** assisted
applications (Phase 10), initial platforms Greenhouse + Lever only. Unattended
submission is not built until the assisted flow is proven reliable. Unsupported
ATS → fall back to Manual Apply. Do not claim universal platform support.

## D-016 — Inngest is the durable-workflow system; not a bus for CRUD
**Status:** Accepted (2026-09-02)

Inngest owns long-running / retryable / scheduled / multi-step work:
resume parsing (Phase 3), scheduled job discovery (Phase 9), assisted-apply
orchestration when it needs durable waiting states (Phase 10), and later
notifications / email classification. Ordinary synchronous work — profile edits,
save/unsave a job, reading the dashboard, manual status changes — stays in the
request path. Inngest is **planned**, not yet installed; it enters the repo in
Phase 3.

## D-017 — Shared Job entity, per-user state separated
**Status:** Accepted (2026-09-02); already partly realised

A public job posting is **one** row, not one-per-user. User-specific state
(`saved_job`, `job_match`, `application`) hangs off `(user_id, job_id)`. The
`per_user_job_status` migration already moved lifecycle state off the shared
`job` table; the rest of this model lands in Phase 4–5. Repeated discovery must
deduplicate via canonical URL / external ID / fingerprint, not create duplicates.

## D-018 — Cross-tenant relational integrity is enforced in the database, not only RLS
**Status:** Accepted (2026-09-02)

RLS answers "may this user touch this row?". It does **not** prove a foreign key
points at a row the same user owns. Every FK from a user-owned row to another
user-owned row carries `user_id` and references a composite `(id, user_id)` key
on the parent, so a cross-tenant reference fails at the database.
Migration `20260902101500_tenant_scoped_child_fks`. New user-owned child tables
in Phase 2+ must follow the same pattern.

## D-019 — Deployment is GitHub Actions → Vercel; no AWS at current scale
**Status:** Accepted (2026-09-02)

Supersedes the old BUILD_PLAN "Phase 17 — Production CI/CD on AWS". Hosting is
Vercel (CLI deploys driven by Actions, gated on green CI); Supabase stays
externally managed. ECR/EC2/ECS/OIDC-to-AWS and immutable-container deployment
are removed from the near-term plan. Full design: `docs/project/CICD.md`.
The AWS-specific decisions D-009 and D-010 are **dormant** — not in force unless
a measured need to leave Vercel appears.

## D-020 — Career Profile does not require a resume
**Status:** Accepted (2026-09-02)

Onboarding offers "Upload résumé (fastest)" **or** "Enter manually". The Career
Profile is the system of record and must be fully usable with zero uploads. A
non-closable "upload before continuing" gate is **not** how Nook onboards.
Resume import is a convenience that produces *reviewed* proposals, never a
silent overwrite (see D-002, D-003).
