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
