# /security-audit

Scope:

$ARGUMENTS

Deep, production-grade security review of the current project. Read-only:
do not fix, commit, or run destructive commands.

## Read first

- `docs/project/ARCHITECTURE.md` — the "Critical invariants" list is the contract
- `docs/project/CURRENT_STATE.md` and the latest `docs/project/logs/*` — what actually ships
- `.agent/ENGINEERING_PLAYBOOK.md` — "Security baseline"
- `docs/project/TECH_DEBT.md` — known, accepted gaps (don't re-report as new)

If a scope was given in $ARGUMENTS, stay inside it. Otherwise audit the whole
current working tree (tracked + untracked), not just the diff.

## Inspect

Static, always:

1. **Secrets** — `.gitignore` covers `.env*`; no secret in tracked files or git
   history; `NEXT_PUBLIC_*` split is correct; `server-only` on every privileged
   module; service-role key absent unless a documented caller needs it.
2. **AuthN** — session validated with `getUser()` (never `getSession()` for trust
   decisions); email-confirmation / autoconfirm posture; password policy;
   account enumeration in error copy; OAuth state / PKCE handling.
3. **AuthZ + tenant isolation** — RLS enabled on every user-owned table; policy
   scoped `user_id = (select auth.uid())` `to authenticated`; **every child FK
   validated in `WITH CHECK`**, not just `user_id`; shared tables are read-only
   to clients; middleware + layout guards agree on the protected route list.
4. **DB functions** — `SECURITY DEFINER` only where needed; `search_path = ''`
   pinned; `EXECUTE` revoked from `anon`/`authenticated`/`public` where relevant.
5. **Redirects** — post-auth `redirectTo` is same-origin only (reject `//`, `/\`,
   absolute URLs); one shared validator, not per-call copies.
6. **Input / output** — reflected query params; `dangerouslySetInnerHTML`;
   SSRF on any server-side fetch of a user-supplied URL; file-upload validation
   (type, size, storage path keyed to owner).
7. **HTTP headers** — CSP, `frame-ancestors`/`X-Frame-Options`, HSTS,
   `X-Content-Type-Options`, `Referrer-Policy`.
8. **Webhooks** — signature verification + idempotency (Stripe, Inngest, etc.).
9. **Background / elevated code** — service-role client callers; AI prompt
   injection where model output drives an action; browser-session security.
10. **Rate limiting / abuse** — auth endpoints, expensive AI/scrape/browser work.
11. **Dependencies** — `npm audit`; lockfile committed; no unpinned install-time
    scripts pulled in this change.
12. **Logging** — no tokens, passwords, or full PII in logs.

Use live checks only when the invocation asks for them (e.g. Supabase advisors,
`pg_policies` audit, a real two-user isolation probe).

## Classify each finding

- MUST FIX — exploitable now, or a tenant/secret/auth boundary is missing
- SHOULD FIX — real weakness, not yet directly exploitable, or infra not wired
- OPTIONAL — defense-in-depth / hardening

For each: location · problem · impact (concrete scenario) · recommended direction.
Do not restate accepted items from `DECISIONS.md` / `TECH_DEBT.md` as new
findings — reference them, and only flag if the risk is understated.

## Return

## Overall
## MUST FIX
## SHOULD FIX
## OPTIONAL / DEFENSE-IN-DEPTH
## Preserve   — correct controls not to regress

## Verdict
SAFE TO PROCEED / HARDEN BEFORE NEXT PHASE / BLOCKING ISSUE

Do not modify code. Do not commit or deploy.
