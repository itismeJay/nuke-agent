# /remember

Optional note:

$ARGUMENTS

Record accepted work from repository evidence.

Inspect:
- git status
- git diff
- recent commits when useful
- migrations
- configuration
- tests
- current project docs

Never log secrets or private user data.

## Update

### `docs/project/CURRENT_STATE.md`
Keep a concise snapshot:
- current phase
- what works
- in progress
- blockers
- active architecture
- next task

### `docs/project/logs/YYYY-MM-DD.md`
Append a checkpoint:

## <change>

- **Phase:**
- **What changed:**
- **Database/migrations:**
- **Security/authorization:**
- **Tests/verification:**
- **Decisions:**
- **Known issues:**
- **Next:**

### `docs/project/BUILD_PLAN.md`
Update checklist/status only if evidence supports it.

### `docs/project/DECISIONS.md`
Only for meaningful decisions.

### `docs/project/TECH_DEBT.md`
Add/remove debt when actually introduced/resolved.

Do not create a git commit unless explicitly asked.

Report documentation updated and any discrepancy between docs and repo.
