# /ship

Target:

$ARGUMENTS

Do not automatically merge or deploy.

Perform pre-merge/pre-release readiness review.

Check relevant:

## Scope
- approved requirements met
- no unrelated future work

## Correctness
- acceptance criteria
- important edge cases

## Data
- migrations
- constraints
- indexes
- backward compatibility
- rollback implications

## Security
- authorization
- secrets
- untrusted inputs
- privileged clients

## Reliability
- retries
- idempotency
- partial failures

## Tests
- correct layers exist

## Quality
Run/confirm relevant:
- format
- lint
- typecheck
- tests
- build
- security checks

## Documentation
Recommend `/remember` if accepted work has not been recorded.

Verdict:

- READY
- READY WITH NON-BLOCKING FOLLOW-UPS
- NOT READY

Separate blockers from follow-ups.

Do not commit/merge/tag/deploy unless explicitly requested afterward.
