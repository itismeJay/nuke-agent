# /init-project

Arguments:

$ARGUMENTS

Purpose: initialize the agent documentation system for an existing/new repository.

Do not implement product features.

## Process

1. Inspect repository root, package/build files, source structure, tests, CI, migrations, and git status.
2. Identify stack and current capabilities.
3. Determine whether project docs already exist.
4. Create/update:
   - `docs/project/PROJECT_BRIEF.md`
   - `docs/project/ARCHITECTURE.md`
   - `docs/project/FOLDER_STRUCTURE.md`
   - `docs/project/BUILD_PLAN.md`
   - `docs/project/CURRENT_STATE.md`
   - `docs/project/DECISIONS.md`
   - `docs/project/TECH_DEBT.md`
5. Do not invent completed functionality.
6. Clearly label unknowns.
7. Recommend the first development phase.

Return:
- detected stack
- current maturity
- documentation created/updated
- risks
- next recommended task

Do not start implementation.
