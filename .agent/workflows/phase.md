# /phase

Requested phase:

$ARGUMENTS

Read `docs/project/BUILD_PLAN.md`.

## Rules

- Implement only the requested/current phase.
- Do not start the next phase.
- Inspect existing work before creating duplicate code.
- Treat the phase's checklist and Done When section as the contract.
- If a prerequisite is incomplete, stop and report it.
- If the phase conflicts with architecture/decisions, report the conflict before changing direction.

## Before editing

State:
- current phase status
- checklist items already complete
- checklist items remaining
- files/schema likely affected
- test/security concerns

## Implement

Complete the smallest safe set of changes necessary for this phase.

## Verify

Run relevant real:
- format
- lint
- typecheck
- tests
- build
- security/database checks

## Finish

Report every checklist item as:
- DONE
- BLOCKED
- NOT DONE

Do not mark the phase COMPLETE unless every required Done When condition is met.

Recommend `/remember` after human acceptance.
