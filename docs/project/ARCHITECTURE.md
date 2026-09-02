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
- Browserbase: **user-initiated** assisted application execution (user submits) — D-015
- GitHub Actions → Vercel: CI/CD and hosting (D-019); Supabase stays externally managed. No AWS at current scale.

## Architectural style

Start as a modular monolith.

Do not introduce microservices, Kafka, Kubernetes, Redis, or additional databases without a concrete operational requirement.

## Critical invariants

1. Users cannot access another user's private data — enforced by RLS **and** by
   composite `(id, user_id)` foreign keys so a child row cannot reference another
   tenant's parent (D-018).
2. Master resumes are immutable; resume import produces *reviewed* proposals,
   never a silent overwrite (D-002, D-003, D-020).
3. Generated resume claims must be supportable by trusted profile facts.
4. Historical application snapshots do not change later.
5. Important application history is append-only.
6. Retries must not cause duplicate applications.
7. Sensitive answers are never fabricated — unknown → `NEEDS_USER_INPUT`.
8. The user controls final application submission. Assisted Apply pauses for
   review; unattended autonomous submission is postponed (D-014) and, when built,
   requires explicit rules + a global kill switch.
9. Long-running / retryable / scheduled work runs in Inngest, not HTTP requests
   (D-016).
10. Secrets never reach client code.
