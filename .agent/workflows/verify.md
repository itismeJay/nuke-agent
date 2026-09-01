# /verify

Scope:

$ARGUMENTS

Read repository scripts/configuration first. Never invent command names.

Run the relevant available checks:

1. formatting check
2. lint
3. typecheck/compile
4. targeted unit tests
5. integration tests
6. authorization/RLS tests when relevant
7. concurrency/idempotency tests when relevant
8. broader test suite
9. production build
10. local security/static checks when available

Do not:
- add `any` to silence types
- blanket-disable lint
- skip tests
- weaken assertions
- hide failures

Return:

| Check | Result | Notes |
|---|---|---|

Overall: PASS / FAIL

List:
- blockers
- checks not run
- why they were not run

Do not deploy/commit.
