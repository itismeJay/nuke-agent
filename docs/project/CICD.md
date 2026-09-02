# Nook — CI/CD

How code gets from `git push` to production, what can stop it, and how to undo it.

Infra is deliberately small: **GitHub** (source) → **GitHub Actions** (CI + deploy
orchestration) → **Vercel** (hosting) → **Supabase** (managed DB/Auth/Storage).
No AWS, no containers in production, no paid DevOps services.

---

## Architecture

```
Developer
   │  git push
   ▼
GitHub  ──────────────────────────────────────────────────────────────────
   │                                          │
   │ push to main                             │ pull_request → main
   ▼                                          ▼
GitHub Actions: CI  (.github/workflows/ci.yml + codeql.yml)
   │
   ├── quality      : npm ci · lint · typecheck · test           (parallel)
   ├── build        : npm ci · next build (clean placeholder env) (parallel)
   ├── security     : gitleaks (git history) · npm audit --high   (parallel)
   └── codeql       : static taint analysis (separate workflow)   (parallel)
        │
        ▼  all required jobs green?
   ┌────┴─────────────────────────────┐
   NO                                 YES
   ▼                                  ▼
 pipeline red            ┌────────────┴─────────────┐
 NOTHING deploys         │ event = PR        event = push to main
                         ▼                          ▼
                 deploy-preview             deploy-production
                 (needs: quality,           (needs: quality,
                  build, security)            build, security)
                 vercel pull (preview)       vercel pull (production)
                 vercel build                vercel build --prod
                 vercel deploy --prebuilt    vercel deploy --prebuilt --prod
                 smoke test preview URL      concurrency: production-deploy
                 comment URL on PR                     │
                         │                             ▼
                         ▼                     smoke test production URL
                   preview URL                         │
                                              green ▼        ✗ smoke fails
                                          done, live   deployment exists but
                                                       is flagged → rollback
```

**The guarantee:** `deploy-*` jobs declare `needs: [quality, build, security]`.
GitHub Actions will not start a job whose `needs` failed. A red gate → no deploy.
This holds for **direct pushes to `main`**, not just PRs — which matters because
`main` is currently unprotected and takes direct pushes.

Vercel's own Git integration is **not** used for deployments (see
[Why Actions-controlled deploys](#why-actions-controlled-deploys)).

---

## CI

### Workflow files

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | push→main, PR→main | quality + build + security gates, then preview/production deploy |
| `.github/workflows/codeql.yml` | push→main, PR→main, weekly cron | CodeQL static analysis (JS/TS), results in Security → Code scanning |
| `.github/dependabot.yml` | weekly | dependency + GitHub-Actions update PRs |

### Jobs

| Job | Runs | Commands | Fails when | Blocks deploy? |
|---|---|---|---|---|
| **quality** | every push/PR | `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` | lint error, type error, or a failing test | ✅ yes |
| **build** | every push/PR | `npm ci`, `npm run build` (placeholder public env) | `next build` fails (incl. its internal `tsc`) | ✅ yes |
| **security** | every push/PR | gitleaks over git history; `npm audit --audit-level=high --omit=dev` | a committed secret is found, or a **high/critical** vuln in a production dependency | ✅ yes |
| **codeql** | push/PR + weekly | CodeQL init + analyze | (reports findings; does not hard-fail the merge unless you later add it as a required check) | ⚠️ advisory now |
| **deploy-preview** | PR only, `DEPLOY_ENABLED=true`, same-repo (not fork) | `vercel pull/build/deploy` (preview), `scripts/smoke.sh` | any Vercel step or the smoke test fails | — |
| **deploy-production** | push→main, `DEPLOY_ENABLED=true` | `vercel pull/build/deploy --prod`, `scripts/smoke.sh` | any Vercel step or the smoke test fails | — |

### Determinism & speed

- **`npm ci`** everywhere (never `npm install` in CI) — installs exactly the
  lockfile, fails on lockfile/`package.json` drift.
- **Node pinned** in `.nvmrc` (`22`) + `engines` in `package.json`; every job
  uses `actions/setup-node` with `node-version-file: .nvmrc`.
- **npm cache** via `actions/setup-node`'s `cache: npm` (keyed on the lockfile).
- **Parallelism:** `quality`, `build`, `security`, `codeql` are independent and
  run at once. Deploy waits on the first three.
- **Concurrency:** a newer PR commit cancels the older CI run
  (`cancel-in-progress` on PRs). A push to `main` is never cancelled. Production
  deploys run one at a time (`concurrency: production-deploy`,
  `cancel-in-progress: false`) — a half-finished production rollout is worse
  than a short queue.
- **Known duplicate work:** `build` runs `next build` and `deploy-*` runs
  `vercel build`. They produce different artifacts (`.next/` vs
  `.vercel/output/`). The CI build is the *gate*; the Vercel build is the
  *deployable*. Acceptable at this size; revisit if CI minutes ever cost money
  (this repo is public → Actions minutes are free).

---

## CD

### Why Actions-controlled deploys

Requirement: **a revision that failed required CI must never reach production.**

Vercel's GitHub integration deploys on every push **independently of GitHub
checks** — it has no native "wait for CI" gate for production. Connecting it the
default way would let a red pipeline ship.

So: Vercel's Git auto-deploy is turned **off**, and GitHub Actions drives Vercel
through its CLI:

```
vercel pull      # fetch project settings + the target environment's vars
vercel build     # compile to .vercel/output (Build Output API)
vercel deploy --prebuilt   # upload the prebuilt output, no build on Vercel
```

Because the deploy job `needs: [quality, build, security]`, the deploy simply
does not run when a gate is red.

### What triggers what

| Event | Result |
|---|---|
| PR opened/updated against `main` | CI runs. If green **and** `DEPLOY_ENABLED=true`: a **Preview** deploy + smoke test, preview URL commented on the PR. Fork PRs get CI only (no secrets, no deploy). |
| Push to `main` (direct or merge) | CI runs. If green **and** `DEPLOY_ENABLED=true`: a **Production** deploy + smoke test. |
| Weekly cron | CodeQL re-scan; Dependabot opens update PRs (which then run full CI). |

### Enabling deploys

Deploy jobs are inert until the repo variable **`DEPLOY_ENABLED`** is `true`
*and* the `VERCEL_*` secrets exist. Until then CI still runs and gates every
commit — you just deploy from the Vercel dashboard / `vercel` CLI manually. Flip
`DEPLOY_ENABLED` when the Vercel project and secrets are in place
([GitHub configuration](#github-configuration-required)).

---

## Environments

| | Development | Preview | Production |
|---|---|---|---|
| Where | your laptop | Vercel, one per PR | Vercel, `main` |
| URL | `localhost:3000` | `nook-<hash>.vercel.app` | the production domain |
| Env vars from | `.env.local` (gitignored) | Vercel → Settings → Environment Variables (Preview scope) | Vercel (Production scope) |
| Supabase project | shared dev project (for now) | **should** be a separate non-prod project before real users exist | production project |
| Data | disposable | **never** production data | real user data |

Preview must never receive production service-role keys or point at the
production database by default. Today Preview and Production share one Supabase
project; splitting them is a prerequisite for "ready for initial production"
(see [Verdict](#production-readiness-verdict)).

---

## Secrets Matrix

No values here — only where each lives. "Browser-visible" = shipped in the
client bundle by design.

| Name | Secret? | Browser-visible? | GitHub | Vercel | Local (`.env.local`) | Purpose |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | yes | placeholder in `ci.yml` `build` job | Preview + Production | yes | Supabase API URL. RLS, not this value, protects data. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | yes | placeholder in `ci.yml` `build` job | Preview + Production | yes | Publishable/anon key. Public by design. |
| `NEXT_PUBLIC_SITE_URL` | no | yes | placeholder in `ci.yml` `build` job | Preview + Production | yes | Base URL for building OAuth redirect URLs. |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | **never** (must not be `NEXT_PUBLIC_*`) | ❌ not in GitHub | Production only (Preview only if a job truly needs it, pointed at non-prod) | blank until a background job needs it | Bypasses RLS. Server-only (`lib/supabase/admin.ts`, `import "server-only"`). |
| `VERCEL_TOKEN` | **YES** | no | repo secret; exposed only to `deploy-*` steps via step-level `env` | n/a | no | Lets Actions call the Vercel API. Scope it to this project; rotate if leaked. |
| `VERCEL_ORG_ID` | low | no | repo secret (or variable) | n/a | in `.vercel/project.json` after `vercel link` | Identifies the Vercel team/account. Not sensitive alone. |
| `VERCEL_PROJECT_ID` | low | no | repo secret (or variable) | n/a | in `.vercel/project.json` after `vercel link` | Identifies the Vercel project. Not sensitive alone. |
| `DEPLOY_ENABLED` | no | no | repo **variable** (`true`/unset) | n/a | n/a | Master switch for the deploy jobs. |
| `GITHUB_TOKEN` | auto | no | injected per-run by GitHub | n/a | n/a | Ephemeral. Used for the PR preview comment + gitleaks. Permissions pinned per job. |
| AI provider keys, `BROWSERBASE_*`, `INNGEST_*` | **YES** | never | ❌ | Production (+ non-prod for Preview) | as needed | Added in later phases. Same rules as the service-role key. |

**Rules that hold for all of the above**

- A production secret is exposed only to the job/step that needs it, never to
  `quality` / `build` / `security` / fork-PR jobs.
- Real secret values never appear in a workflow file, a commit, or a log.
  `${{ secrets.X }}` is masked in logs; still, we pass secrets through
  step-level `env:` and reference `$X` in scripts rather than inlining
  `${{ }}` into shell.
- `.gitignore` covers `.env*` except `.env.example` (placeholders only).
- gitleaks (CI) + GitHub push protection (already enabled) are the backstops.

---

## Supabase & database migrations

Migrations are SQL files in `supabase/migrations/`, committed, ordered by a
`YYYYMMDDHHMMSS` prefix. They are the record of what has been applied to the
remote project.

### Rules

- **Migrations stay in Git.** New schema change → new migration file. Never
  edit a migration that has already been applied (only exception: a genuine
  emergency, documented in `DECISIONS.md`).
- **Migrations do NOT run automatically on deploy.** Applying schema changes is
  a separate, deliberate step (today: Supabase MCP `apply_migration` or the
  dashboard SQL editor; later: a `workflow_dispatch`-only workflow gated by a
  GitHub Environment approval). Automatic destructive DDL on every push is an
  outage waiting to happen.
- After a migration changes tables/columns, regenerate
  `lib/supabase/database.types.ts` (TECH_DEBT TD-003).

### Expand → migrate → contract (why backward-compatible migrations matter)

During any rolling deploy (Vercel included) there is a window where **old and
new application code both talk to the same database**. If a migration removes or
renames a column that old code still reads, the old instances 500 during that
window.

So schema changes are done in three phases, deployed separately:

1. **Expand** — add the new shape (new nullable column / new table / new
   function). Old and new code both work. Deploy.
2. **Migrate + deploy compatible app** — backfill data; ship app code that
   writes/reads the new shape but tolerates the old.
3. **Contract** — only after all traffic is on the new code, drop the old
   column / constraint. Deploy.

Never collapse these into one step for a column that is currently read in
production.

### RLS / tenant-isolation tests (planned)

Nook's security depends on Postgres RLS, so CI should eventually assert the
critical property directly:

```
User A inserts a private row
User B SELECT  → 0 rows
User B UPDATE  → 0 rows affected, A's row intact
User B DELETE  → 0 rows affected
anon SELECT    → 0 rows
```

Options and trade-offs:

| Approach | Pros | Cons |
|---|---|---|
| **Supabase CLI local stack** in CI (Docker on the runner) | real Postgres + real policies; free; hermetic; no shared state | needs the CLI + Docker in CI; migrations must apply cleanly from scratch; ~1–2 min startup |
| **Dedicated free test Supabase project** | closest to prod PostgREST behaviour; no Docker | shared mutable state between runs; rate limits; a live credential in CI |
| **Staging environment** | end-to-end realistic | most infra; overkill now |

**Recommendation:** Supabase CLI local stack, added as its own `db-tests` job
that runs `supabase start`, applies `supabase/migrations/`, seeds two users, and
runs the isolation assertions. **Normal CI never needs production credentials
for this.** Not built yet — it is the main gap between "preview" and "initial
production".

---

## Failure behaviour

| Failure | Pipeline result | Does production deploy? |
|---|---|---|
| `npm ci` fails (lockfile drift, registry down) | job red | **No** |
| `npm run lint` fails | `quality` red | **No** |
| `npm run typecheck` fails | `quality` red | **No** |
| a test fails | `quality` red | **No** |
| `npm run build` fails | `build` red | **No** |
| gitleaks finds a committed secret | `security` red | **No** — and rotate the exposed credential immediately |
| `npm audit` finds a **high/critical** prod vuln | `security` red | **No** |
| `npm audit` finds low/moderate | reported, job green | Yes (triage via Dependabot) |
| CodeQL finds an issue | alert raised | Yes, unless you've made CodeQL a required check |
| `vercel build` / `vercel deploy` fails | `deploy-production` red | **No** — previous production deployment stays live |
| smoke test fails after deploy | `deploy-production` red | The new deployment **exists on Vercel** but the job is red → **roll back** (below). It is not auto-promoted away; Vercel's "current production" alias may already point at it, so act. |
| regression found hours later | pipeline was green | roll back, then fix forward |

---

## Rollback

Vercel keeps every deployment as an immutable, addressable build. Rollback =
point the production alias back at a known-good one. No custom infra.

### 1. Build failed in CI / Vercel
Nothing was promoted. Fix the code, push again.

### 2. `vercel deploy` step failed
Nothing was promoted. Re-run the job (Actions → failed run → *Re-run failed
jobs*) once the cause is fixed.

### 3. Smoke test failed after deploy
The bad build may be the current production alias. Roll back now:

```bash
vercel rollback --token=<VERCEL_TOKEN>          # → previous production deployment
# or target one explicitly:
vercel ls                                       # find the last good deployment URL
vercel promote <good-deployment-url> --token=<VERCEL_TOKEN>
```

or in the dashboard: **Project → Deployments → (last good one) → ⋯ → Promote to
Production**. Then open an issue and fix forward.

### 4. Regression found later
Same as (3): `vercel promote <last-good-url>`. If a **migration** is involved,
rolling back app code is not enough — assess whether the schema change was
backward-compatible (it should have been; see expand/contract). If a `contract`
step broke old code, re-add the dropped object as a new migration.

### Database
App rollback never rolls back the database automatically. Because migrations are
expand-first and backward-compatible, an app rollback is safe on its own. A bad
migration is fixed with a **new** forward migration, not by editing history.

---

## GitHub configuration required

One-time, via the GitHub UI or `gh`:

1. **Enable Dependabot alerts + security updates**
   *Settings → Code security → Dependabot* → enable "Dependabot alerts" and
   "Dependabot security updates".
   Or: `gh api -X PUT repos/<owner>/<repo>/vulnerability-alerts` and
   `gh api -X PUT repos/<owner>/<repo>/automated-security-fixes`.
   (Secret scanning + push protection are already on.)

2. **Add deployment secrets** (*Settings → Secrets and variables → Actions →
   Secrets*), only once the Vercel project exists:
   - `VERCEL_TOKEN` — Vercel → *Account Settings → Tokens* → create a token
     scoped to the Nook project. Secret. Rotatable.
   - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link` (the
     `orgId` field).
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json` (`projectId`).

3. **Add the deploy switch** (*Settings → Secrets and variables → Actions →
   Variables*):
   - `DEPLOY_ENABLED` = `true`

4. **(Recommended, not required) protect `main` later**
   *Settings → Branches → Add rule* for `main`: require the `quality`, `build`,
   `security` status checks to pass before merge; require a PR. This upgrades
   the guarantee from "bad commit can land on main but never deploys" to "bad
   commit cannot land on main". Your current direct-to-main workflow keeps
   working until you choose to do this.

5. **(Optional) require a reviewer for production**
   *Settings → Environments → production → Required reviewers*. Makes every
   production deploy a one-click human approval.

---

## Vercel configuration required

One-time:

1. **Create the project** — import `nuke-agent` in the Vercel dashboard, *or*
   run `vercel link` locally (creates `.vercel/`, which is gitignored).
2. **Turn OFF automatic Git deployments** so Actions is the only deployer:
   *Project → Settings → Git* → set the production branch behaviour to not
   auto-deploy (disconnect the Git integration, or set an *Ignored Build Step*
   command of `exit 0`). Actions calls `vercel deploy` explicitly.
3. **Set environment variables** — *Project → Settings → Environment Variables*:
   - Production scope: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `NEXT_PUBLIC_SITE_URL` (the real production URL), and later
     `SUPABASE_SERVICE_ROLE_KEY` + provider keys.
   - Preview scope: the same names, pointed at a **non-production** Supabase
     project once one exists; `NEXT_PUBLIC_SITE_URL` can be left to Vercel's
     per-deployment URL or a stable preview alias.
4. **Framework preset** = Next.js (auto-detected). No `vercel.json` needed yet.
5. **Domains** — add the production domain under *Project → Settings → Domains*
   when ready; update Supabase Auth → URL Configuration redirect URLs to match
   (and re-enable email confirmation — `DECISIONS.md` D-013).

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| CI job red | GitHub → **Actions** tab → the run → the failed job's step logs. Reproduce locally: `npm ci && npm run lint && npm run typecheck && npm test && npm run build`. |
| `security` red on gitleaks | The log names the file + commit. If it's a real secret: rotate it, then scrub history (`git filter-repo`) — rotation first. If false positive: add a scoped entry to `.gitleaks.toml` `[allowlist]`. |
| `security` red on `npm audit` | `npm audit --audit-level=high --omit=dev` locally. Fix via `npm audit fix` or a targeted bump. Don't force a major upgrade just to zero the count. |
| CodeQL alert | GitHub → **Security → Code scanning**. Each alert has the data-flow path. |
| Preview deploy didn't run | Is `DEPLOY_ENABLED` = `true`? Is the PR from a fork (expected: no deploy)? Did a gate fail? |
| `vercel` step fails with auth error | `VERCEL_TOKEN` missing/expired/wrong scope, or `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` don't match the token's account. |
| Deploy green but site broken | Vercel → **Deployments** → the deployment → **Build Logs** and **Runtime Logs** (Functions). Usually a missing/wrong env var for that scope. |
| Auth / OAuth broken in preview or prod | Supabase → **Logs** (Auth), and Supabase → **Authentication → URL Configuration** — the deployment URL must be an allowed redirect. |
| DB error | Supabase → **Logs** (Postgres / PostgREST) and **Advisors**. |
| Smoke test failing | `scripts/smoke.sh <url>` locally against the deployment URL; it prints each route + status. |

---

## Cost

| Component | Cost |
|---|---|
| GitHub Actions (public repo) | **Free — unlimited minutes** |
| GitHub secret scanning + push protection | **Free** (public repo) |
| CodeQL code scanning | **Free** (public repo) |
| Dependabot alerts + updates | **Free** |
| gitleaks (OSS action) | **Free** |
| Vitest | **Free** (OSS) |
| Vercel Hobby (preview + prod, CLI deploys) | **Free** — *potentially metered* if usage grows or the project is deemed commercial (→ Vercel Pro) |
| Supabase CLI local stack for RLS tests (later) | **Free** (Docker on the runner) |
| Datadog / Snyk paid / paid scanners / paid CI | **Not used** — *optional paid evolution only* |

---

## Test strategy

| Layer | Tool | Runs in CI | Status |
|---|---|---|---|
| **Unit** — pure/deterministic logic (redirect safety, auth error mapping, `cn`, later: match scoring, transforms, validation) | Vitest (`node` env) | `quality` job, always | ✅ **now** — `lib/**/*.test.ts` |
| **Component** — React components with RTL + jsdom | Vitest + `@testing-library/react` | `quality` job | later, when component logic is non-trivial |
| **Integration** — server actions, Supabase client behaviour | Vitest against a local Supabase stack | own `db-tests` job | later |
| **Authorization / RLS isolation** — two-user SELECT/UPDATE/DELETE denial | SQL assertions vs local Supabase stack | own `db-tests` job | later — **gates "initial production"** |
| **E2E** — sign-up → dashboard, apply flow | Playwright vs the preview URL | after `deploy-preview` | later |

Principle: not every behaviour is an E2E test. Push logic down to unit tests;
reserve integration/RLS for the database boundary and E2E for a few critical
journeys.

---

## Security controls protecting the pipeline

- `permissions: contents: read` at workflow level; jobs elevate narrowly
  (`deploy-preview` adds only `pull-requests: write`).
- Third-party actions pinned to a full commit SHA (`# vX.Y.Z` comment for
  humans); Dependabot's `github-actions` ecosystem bumps them.
- `pull_request` trigger, **not** `pull_request_target` — fork PR code never
  runs with write tokens or secret access.
- `deploy-preview` additionally guards on
  `pull_request.head.repo.full_name == github.repository` — forks get CI only.
- `actions/checkout` with `persist-credentials: false`.
- Secrets passed via step-level `env:` and read as shell variables, never
  interpolated as `${{ }}` into a `run:` script (injection safety).
- `VERCEL_TOKEN` reaches only the `deploy-*` jobs.
- `concurrency` on production deploys prevents interleaved rollouts.
- gitleaks + GitHub push protection stop secrets at commit/PR time; `npm audit`
  + Dependabot + CodeQL cover dependency and code-level risk.
