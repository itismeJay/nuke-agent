# Reusable Engineering Playbook

This file is designed to be reusable across software projects.

## Engineering sequence

For major work reason through:

Need
→ Problem
→ Requirements
→ Constraints
→ Design
→ Data/Contracts
→ Implementation
→ Testing
→ Failure Cases
→ Security
→ Observability
→ Deployment
→ Production Considerations

## Review priority

Review code in this order:

1. Correctness
2. Business correctness
3. Data integrity
4. Concurrency / idempotency
5. Security / authorization
6. Architecture
7. Reliability / failure handling
8. Maintainability
9. Performance / cost
10. Style

Use:

- MUST FIX
- SHOULD FIX
- OPTIONAL IMPROVEMENT

## Before coding

Inspect relevant:

- repository structure
- current project state
- build plan
- architecture
- migrations
- types/schemas
- tests
- API/server boundaries
- authorization policies
- configuration

Determine:

- actor
- source of truth
- ownership
- invariants
- happy path
- failure paths
- retry semantics
- concurrency risk
- authorization
- audit/history requirements
- testing strategy
- observability
- explicit out-of-scope items

## Implementation rules

- Make the smallest coherent change.
- Keep business logic out of presentation code.
- Validate untrusted input at boundaries.
- Enforce authorization server-side.
- Put true invariants in database constraints where appropriate.
- Treat external APIs, web content, uploaded files, and AI output as untrusted.
- Make retryable work idempotent.
- Do not silently swallow failures.
- Prefer simple infrastructure until requirements justify complexity.
- Do not casually change public contracts or schemas.
- Use migrations for persistent schema changes.

## Testing

Choose the appropriate layers:

### Unit
Deterministic domain logic.

### Integration
Database, storage, framework, API/server boundaries.

### Authorization / isolation
Verify tenant/user separation where applicable.

### Concurrency / idempotency
Use where duplicate execution or races are possible.

### E2E
Use for critical journeys; do not make every behavior an E2E test.

## Security baseline

Always consider:

- authentication
- authorization
- tenant/user isolation
- secrets
- SSRF
- XSS
- SQL injection
- file uploads
- OAuth state/redirects
- CSRF where relevant
- webhook verification
- rate limits
- dependency/supply-chain risk
- prompt injection when AI is used
- logging of sensitive data
- admin privilege boundaries

## Completion rule

A feature is not complete because the UI renders.

Completion means relevant:

- requirements satisfied
- authorization correct
- data model safe
- validation implemented
- tests added
- failure handling exists
- lint/typecheck/build pass
- security reviewed
- docs/state updated when accepted

Never claim checks passed unless they actually ran successfully.
