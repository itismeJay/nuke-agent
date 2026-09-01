# /plan

Target:

$ARGUMENTS

Do not implement yet.

## Inspect

Read:
- current state
- build plan
- architecture
- relevant feature spec
- existing source/migrations/types/tests

If requirements are still materially ambiguous, stop and recommend `/grill-me`.

## Produce an implementation plan

Include:

1. Goal
2. Preconditions
3. Files/modules likely affected
4. Data/schema changes
5. API/contracts
6. UI changes
7. Background workflows
8. Authorization/security
9. Failure handling
10. Tests
11. Migration/rollout concerns
12. Ordered implementation steps
13. Definition of done
14. Explicit out-of-scope items

If asked to save the plan, write it under:

`docs/features/active/<feature-slug>.md`

Do not code until explicitly requested.
