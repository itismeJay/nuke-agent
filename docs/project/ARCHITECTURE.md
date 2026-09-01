# Nook — Architecture

## Initial architecture

```text
User
 |
 v
Next.js modular monolith
 |
 +--> Supabase PostgreSQL
 |      +--> Auth
 |      +--> RLS
 |      +--> Storage
 |
 +--> Inngest
        |
        +--> AI provider abstraction
        |
        +--> Job discovery/extraction
        |      +--> official ATS/job APIs
        |      +--> Brave Search
        |      +--> native HTTP
        |      +--> Scrapling fallback
        |
        +--> Application Agent
               +--> Browserbase
```

## Responsibilities

- Next.js: UI, synchronous app/server behavior, domain modules
- Supabase: PostgreSQL, authentication, RLS, private files
- Inngest: scheduled/retryable/multi-step background workflows
- AI: parse/understand/rewrite constrained unstructured content
- Matching engine: deterministic authoritative job score
- Brave/APIs: discover job opportunities
- HTTP/Scrapling: extract job content
- Browserbase: interactive application execution
- GitHub Actions: CI/CD
- AWS: container registry/compute/runtime infrastructure later

## Architectural style

Start as a modular monolith.

Do not introduce microservices, Kafka, Kubernetes, Redis, or additional databases without a concrete operational requirement.

## Critical invariants

1. Users cannot access another user's private data.
2. Master resumes are immutable.
3. Generated resume claims must be supportable by trusted profile facts.
4. Historical application snapshots do not change later.
5. Important application history is append-only.
6. Retries must not cause duplicate applications.
7. Sensitive answers are never fabricated.
8. Auto Apply requires explicit rules and a global kill switch.
9. Long-running work belongs outside normal HTTP request lifetimes.
10. Secrets never reach client code.
