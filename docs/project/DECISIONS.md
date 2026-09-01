# Nook — Engineering Decisions

## D-001 — Modular monolith first
**Status:** Accepted

Keep domains separated in code without introducing network microservices before scale/runtime needs justify them.

## D-002 — Career Profile is the source of truth
**Status:** Accepted

Structured verified career data is authoritative. Resumes are not the authoritative data model.

## D-003 — Master resumes are immutable
**Status:** Accepted

Tailoring creates new versioned artifacts.

## D-004 — Supabase for initial database/auth/storage
**Status:** Accepted

Use PostgreSQL + Auth + RLS + private storage to reduce initial operational burden while preserving relational semantics.

## D-005 — Inngest for durable background work
**Status:** Accepted

Scheduled, long-running, retryable, multi-step work should not depend on ordinary HTTP request lifetimes.

## D-006 — Match scoring is deterministic
**Status:** Accepted

AI extracts requirements/explanations. Versioned deterministic code calculates authoritative scores.

## D-007 — Simple extraction first
**Status:** Accepted

Use official APIs/native HTTP before Scrapling/browser extraction.

## D-008 — Browserbase for interactive application execution
**Status:** Accepted

Browser infrastructure is primarily for navigation/forms/uploads/submission, not routine discovery.

## D-009 — Immutable deployment artifacts
**Status:** Accepted

Production should deploy tested/scanned Docker artifacts, not build source on the server.

## D-010 — GitHub OIDC for AWS
**Status:** Accepted

Use temporary AWS credentials rather than permanent GitHub-stored AWS access keys.
