# /debug

Problem:

$ARGUMENTS

Do not immediately rewrite code.

## Evidence-first method

1. Observed behavior
2. Expected behavior
3. Reproduction
4. Relevant logs/errors
5. Trace the smallest failing path
6. Ranked hypotheses
7. Cheapest discriminating test
8. Root cause
9. Smallest safe fix
10. Regression test
11. Verification

For async/distributed work inspect:
- retry behavior
- duplicate execution
- race conditions
- timeouts
- partial success
- stale state
- idempotency

For auth/data bugs inspect:
- session/cookies
- authorization
- tenant/user scoping
- elevated/admin client usage

If evidence is insufficient, state what is missing.
