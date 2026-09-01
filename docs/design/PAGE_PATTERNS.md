# Nook — Page Patterns

Use these as composition guidelines, not rigid templates.

---

# Landing Page

Quality references:
Framer motion + Vercel/Resend restraint.

## Goal

Communicate:

- what Nook is
- why the user cares
- how the system works
- one primary CTA

## Recommended structure

1. Minimal navigation
2. Hero
3. Interactive product/workflow preview
4. Product value sections
5. Trust / proof only when real
6. Final CTA
7. Minimal footer

## Hero

Potential Nook message:

**Your career, in motion.**

Supporting concept:

Build your career profile once. Nook helps discover opportunities, understand your fit, tailor application materials, and keep the job search organized.

Use a meaningful product visual, not a random abstract gradient.

Marketing motion may demonstrate:

Profile
→ Match
→ Tailor
→ Apply
→ Track

Do not fabricate product metrics or customer logos.

---

# Authentication Pages

Quality reference:
Clerk + Resend restraint.

## Goal

Fast, trustworthy, low-friction authentication.

Potential composition:

- brand
- title
- one-line context
- Google OAuth
- divider
- email/password fields
- password recovery
- submit
- switch sign-in/sign-up link

Desktop may use a subtle split composition if it adds real value.

Mobile should remain one focused column.

Do not bury auth in a huge decorative marketing page.

---

# Onboarding

Use progressive disclosure.

Show:
- clear current step
- why information is needed
- ability to correct information
- save/continue
- back where appropriate

Do not ask for every possible career field in one giant form.

---

# Dashboard

Quality reference:
Linear + Attio.

## Goal

Answer:

"What should I care about now?"

Prefer:
- top job matches
- application state
- current automation state
- meaningful recent activity
- onboarding next step when profile incomplete

Do not build a wall of vanity metrics.

---

# Profile

Record/detail-oriented.

Prefer:
- clear sections/tabs
- editable structured information
- provenance where meaningful
- dense but readable records
- inline actions

---

# Jobs

Prefer:
- search/filter toolbar
- list or split-pane detail
- clear match score
- required/missing skills
- save/tailor/apply actions
- good information density

Possible desktop pattern:
job list left / job detail right.

On mobile:
list → detail navigation.

---

# Applications

Prefer:
- table as default high-density view
- optional Kanban
- strong status filters
- immutable resume/application context in detail view
- timeline

---

# Automation

This page controls potentially dangerous behavior.

Use:
- clear enabled/disabled state
- concise explanation
- grouped rules
- visible limits
- recent decisions
- warnings only where meaningful

Do not make Auto Apply look casually equivalent to a theme toggle.

---

# Agent Runs

Operational/transparent.

Show:
- current state
- steps
- waiting input
- error
- application/job context
- browser execution context when safe

Avoid exposing raw internal chain-of-thought.

---

# Admin

Higher density than consumer pages.

Use:
- data tables
- filters
- operational health
- costs
- failures
- clear privilege-aware actions

Do not expose private content unnecessarily.
