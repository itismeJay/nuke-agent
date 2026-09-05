# supabase/

Migration history for the Nook Postgres database (Supabase project `nook-agent`,
ref `lemtlbepgrkltkmjbmqy`, region `ap-northeast-1`).

These `.sql` files are the checked-in record of migrations already applied to the
remote project. They are ordered by the `YYYYMMDDHHMMSS` timestamp prefix and
match `supabase_migrations.schema_migrations` on the remote **and** the version
recorded by the local CLI stack — keep the filename prefix equal to the applied
version.

| Version | Name | Purpose |
| --- | --- | --- |
| `20260901003112` | `init_multitenant_schema` | Base multi-tenant schema, RLS, `handle_new_user` signup trigger |
| `20260901003144` | `harden_functions` | `security invoker` + pinned `search_path`, revoke EXECUTE from client roles |
| `20260901014234` | `per_user_job_status` | Move per-user job lifecycle state onto `job_analysis` |
| `20260901093525` | `idempotent_account_initialization` | `on conflict do nothing` in `handle_new_user` |
| `20260902034701` | `tenant_scoped_child_fks` | Composite `(id, user_id)` keys + `(child_id, user_id)` FKs so child rows cannot reference another tenant's parent |
| `20260902192324` | `career_profile_schema` | Phase 2: Career Profile tables, shared `skill` catalog, `source` provenance, RLS + composite FKs on every new user-owned table |
| `20260902202542` | `resume_import_schema` | Phase 3: `master_resume` upload/parse-state columns + primary flag, `resume_import` + `resume_import_item` (reviewable proposals), private `master-resumes` Storage bucket + owner-scoped insert-once object policies |

## Local development

```bash
npm run db:start     # supabase start — local stack, migrations auto-applied
npm run db:reset     # replay every migration from scratch onto the local DB
npm run test:db      # tenant-isolation tests against the local DB
npm run gen:types    # regenerate lib/supabase/database.types.ts from the local stack
```

`supabase/config.toml` is committed; `.branches/` and `.temp/` are ignored.

## Applying new migrations

Author the file here (`<version>_<name>.sql`), validate locally with
`npm run db:reset`, then apply to the remote project — via the Supabase MCP
`apply_migration` or `supabase db push`. **The MCP assigns its own version
timestamp**; rename the local file to match what `list_migrations` reports so the
local and remote histories stay identical.

## Regenerating types

`lib/supabase/database.types.ts` — `npm run gen:types` (local stack), or from the
remote with `SUPABASE_ACCESS_TOKEN` set. Regenerate whenever a migration changes
tables/columns.
