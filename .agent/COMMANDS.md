# Agent Commands

## Engineering

### `/init-project`
Audit a new/existing repository and initialize project documentation without implementing features.

### `/grill-me <idea>`
Challenge and clarify a proposed feature before code exists.

### `/plan <feature>`
Turn approved requirements into an implementation-ready plan.

### `/phase <phase>`
Implement exactly one phase from `docs/project/BUILD_PLAN.md`.

### `/feature <feature/spec>`
Implement one approved feature.

### `/review`
Senior/staff-level review of the current changes.

### `/verify`
Run the project's real quality gates.

### `/debug <problem>`
Evidence-first debugging.

### `/remember`
Update current state, logs, roadmap, decisions, and technical debt from accepted repository changes.

### `/status`
Explain where the project currently is and give one main next task.

### `/adr <decision>`
Analyze/record a meaningful architecture decision.

### `/ship`
Pre-merge/pre-release readiness gate.

---

# UI / Design

### `/ui <page/component>`
Build or redesign UI using the project design system while preserving functionality.

### `/ui-review <page/component>`
Review hierarchy, consistency, responsiveness, accessibility, motion, and SaaS polish.

### `/capture-ui <pattern>`
Record a successful reusable UI/page/motion pattern so future work stays consistent.

---

# Recommended Product Workflow

```text
Idea
→ /grill-me
→ /plan
→ /feature OR /phase
→ /review
→ /verify
→ human acceptance
→ /remember
→ /ship
```

# Recommended UI Workflow

```text
Screenshot/reference (optional)
→ /ui
→ /ui-review
→ fix
→ /verify
→ /capture-ui if reusable
→ /remember
```

# Bug Workflow

```text
/debug
→ fix
→ /verify
→ /remember
```
