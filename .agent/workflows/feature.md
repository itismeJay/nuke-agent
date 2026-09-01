# /feature

Feature/spec:

$ARGUMENTS

## Preconditions

Read:
- current project state
- architecture
- build plan
- approved feature spec if present
- relevant implementation/migrations/tests

If requirements are materially ambiguous, stop and recommend `/grill-me`.

If this feature belongs to a later phase, warn before implementing it.

## Implement

- smallest coherent change
- preserve project architecture
- validate input
- enforce authorization
- add constraints for invariants
- use idempotency for retryable operations
- add appropriate tests
- do not rewrite unrelated code

## Verify

Run relevant quality gates.

## Report

- summary
- files changed
- schema/migrations/indexes/constraints
- authorization/security changes
- tests
- verification results
- known limitations
- technical debt
- next recommended action

Do not commit/deploy/start another feature.
