# /review

Scope:

$ARGUMENTS

Review the current diff plus relevant surrounding code.

Do not automatically fix.

Review order:

1. correctness
2. business correctness
3. data integrity
4. concurrency/idempotency
5. security/authorization
6. architecture
7. reliability
8. maintainability/testability
9. performance/cost
10. style

Classify findings:

- MUST FIX
- SHOULD FIX
- OPTIONAL IMPROVEMENT

For each:
- location
- problem
- impact
- recommended direction

End with:

## Verdict
MERGEABLE / NOT MERGEABLE / NEEDS VERIFICATION

## Missing Tests
## Highest Risk
## Good Decisions To Preserve
