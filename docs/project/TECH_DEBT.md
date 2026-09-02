# Nook — Technical Debt

Record real debt only.

Format:

## TD-XXX — Title

- **Status:** OPEN / RESOLVED
- **Introduced:** YYYY-MM-DD
- **Area:** ...
- **Why it exists:** ...
- **Risk:** ...
- **When to address:** ...
- **Resolution:** ...

No known debt should be invented merely to fill this file.

---

## TD-001 — `middleware.ts` uses the deprecated Next 16 convention

- **Status:** OPEN
- **Introduced:** 2026-09-01
- **Area:** routing / auth session refresh
- **Why it exists:** Next 16 renamed this to `proxy.ts`; the `proxy` path throws a
  spurious export error in Turbopack dev on 16.3.4, so `middleware.ts` was kept.
  See DECISIONS D-012.
- **Risk:** Low now (build warning only). A future Next major could remove
  `middleware.ts` support entirely.
- **When to address:** Next upgrade — retry `proxy.ts` and migrate if dev works.
- **Resolution:** —

## TD-002 — No formatter; test coverage is unit-only

- **Status:** MOSTLY RESOLVED (2026-09-02) — formatter + deeper test layers remain
- **Introduced:** pre-existing (Phase 0 checklist)
- **Area:** engineering foundation
- **Why it exists:** Not set up during the scaffold; Phase 1 was prioritised.
- **Resolved so far (2026-09-02):**
  - Vitest unit layer (`lib/**/*.test.ts`); `typecheck` + `test` npm scripts.
  - GitHub Actions CI (`.github/workflows/ci.yml`): install / lint / typecheck /
    test / build + gitleaks + `npm audit --audit-level=high`. CodeQL in
    `codeql.yml`. Actions-controlled Vercel deploy gated on CI. Full design in
    `docs/project/CICD.md`.
  - `.github/dependabot.yml` (npm + github-actions). GitHub secret scanning +
    push protection already on.
  - **RLS / tenant-isolation layer built** (2026-09-03) — `db-tests` job,
    `tests/db/isolation.test.ts` (see TD-005).
- **Still open:**
  - No formatter (Prettier). ESLint is not a formatter.
  - Dependabot **alerts / security updates** are a repo setting still to enable
    (see `CICD.md` → GitHub configuration).
  - Component (RTL) and broader integration test layers are not built.
- **Risk now:** low — every push/PR is gated including two-user RLS isolation.
  Remaining risk is component regressions and style drift.

## TD-003 — `lib/supabase/database.types.ts` typegen

- **Status:** MOSTLY RESOLVED (2026-09-03)
- **Introduced:** 2026-09-01
- **Area:** database types
- **Why it existed:** No local Supabase CLI; the file was pasted from the MCP
  `generate_typescript_types` output.
- **Resolved so far:** Supabase CLI is a dev dependency; `supabase/config.toml`
  committed; `npm run gen:types` (`scripts/gen-types.mjs`) regenerates from the
  local stack (`supabase gen types --local`), falling back to the remote project
  when `SUPABASE_ACCESS_TOKEN` is set.
- **Still open:** no CI check that the committed file matches the schema. Add a
  `gen:types` + `git diff --exit-code` step to the `db-tests` job.
- **Risk now:** low — the `db-tests` job would fail on any real schema/policy
  regression even if the types file lagged.

## TD-004 — `next build` / `next dev` auto-appends a block to `AGENTS.md`

- **Status:** OPEN
- **Introduced:** 2026-09-01 (Next 16 `agentRules` feature)
- **Area:** repo hygiene / agent tooling
- **Why it exists:** Next 16 writes a `<!-- BEGIN:nextjs-agent-rules -->` block into
  `AGENTS.md` on every dev/build run. The repo's `AGENTS.md` is a hand-maintained
  Codex workflow mirror.
- **Risk:** Cosmetic — an always-dirty file unless the block is committed.
- **When to address:** Decide to either commit the block or set `agentRules: false`
  in `next.config.ts`.
- **Resolution:** —

## TD-005 — No automated RLS / two-user isolation test

- **Status:** RESOLVED (2026-09-03)
- **Introduced:** 2026-09-02 (tracked separately from TD-002)
- **Area:** authorization / multi-tenant security
- **Was:** RLS isolation and the composite-FK cross-tenant invariant (D-018) were
  verified once, manually, against the live project — no CI test re-asserted them.
- **Resolution:** `tests/db/isolation.test.ts` (`vitest.config.db.ts`,
  `npm run test:db`) runs SQL assertions against a real Postgres via the Supabase
  CLI stack — impersonating `authenticated` / `anon` with `SET LOCAL ROLE` +
  `request.jwt.claims`, all inside rolled-back transactions. Asserts: a tenant can
  create its own children; B cannot SELECT/UPDATE/DELETE A's rows; a child with
  B's `user_id` + A's parent id is rejected (FK `23503`); RLS `WITH CHECK` blocks
  inserting a row owned by A (`42501`); `anon` sees no private rows and no skill
  catalog. Wired as the `db-tests` CI job, a `needs:` of both deploy jobs.
- **Follow-up:** extend coverage to `job` / future user-owned tables as they land.

## TD-006 — `application.mode` enum predates the current domain model

- **Status:** OPEN (skill half resolved 2026-09-03)
- **Introduced:** 2026-09-01 (initial schema), surfaced 2026-09-02
- **Area:** schema ↔ product model drift
- **Why it exists:** `application.mode` is `check (mode in ('manual','auto'))` —
  the current direction (D-014) is `MANUAL` / `ASSISTED`, with autonomous `auto`
  postponed.
- **Resolved:** the denormalized `skill` table is gone — Phase 2 migration
  `20260902192324` reshaped it into the shared catalog + `profile_skill` /
  `project_skill` (D-021).
- **Still open:** `application.mode`. Fold into the Phase 8 `application` rebuild.
  Do not do a standalone migration now.

---

## Resolved

### R-001 — Cross-tenant parent/child FK vulnerability

- **Status:** RESOLVED (2026-09-02) — migration `20260902101500_tenant_scoped_child_fks`
- **Was:** child tables (`experience`, `project`, `skill`, `education`,
  `master_resume`, `application`) had a single-column FK to their parent; RLS
  checked `user_id` on the row but nothing stopped a caller referencing another
  tenant's `profile_id` / `resume_version_id`.
- **Fix:** composite `(id, user_id)` unique keys on `profile` and
  `resume_version`; every child FK now references `(parent_id, user_id)`.
  Verified: a `user_id` mismatch raises `foreign_key_violation`.
- **Follow-up:** TD-005 (make it a standing CI test).

### R-002 — Phase 1 auth-layer review findings

- **Status:** RESOLVED (2026-09-02) on branch `fix/phase-1-tenant-isolation`
- Password reset now revokes other sessions; `?error=` is a mapped code, not
  reflected text; `ensureAccountInitialized` no longer writes on every request;
  `redirectTo` validation centralized in `lib/auth/redirect.ts` (unit-tested).

---

## Postponed work (deliberate — not debt, tracked so it is not forgotten)

- **Autonomous Auto Apply** — Future Optional A in `BUILD_PLAN.md`. Rule engine,
  idempotency keys, concurrent-worker safety all deferred until Assisted Apply is
  proven.
- **ATS platforms beyond Greenhouse + Lever** (Workable, Wellfound, …) — added
  only after the assisted architecture is reliable (D-015).
- **Pricing / billing model** — Phase 13, blocked on real cost measurement (§41).
- **Deeper observability** (Sentry, cost metrics, correlation IDs) — Phase 15.
- **Broad E2E coverage** (Playwright) — Phase 16.
- **Session hardening beyond current** (device management, step-up auth) — Phase 15.
- **Additional AI providers** behind the abstraction — only if a concrete need
  appears; Claude is the sole provider for now.
- **Separate non-prod Supabase project for Preview** — prerequisite for "initial
  production" (`CICD.md` → Environments).
