# supabase/

Migration history for the Nook Postgres database (Supabase project `nook-agent`,
ref `lemtlbepgrkltkmjbmqy`, region `ap-northeast-1`).

These `.sql` files are the checked-in record of migrations already applied to the
remote project. They are ordered by the `YYYYMMDDHHMMSS` timestamp prefix and
match `supabase_migrations.schema_migrations` on the remote.

| Version | Name | Purpose |
| --- | --- | --- |
| `20260901003112` | `init_multitenant_schema` | Base multi-tenant schema, RLS, `handle_new_user` signup trigger |
| `20260901003144` | `harden_functions` | `security invoker` + pinned `search_path`, revoke EXECUTE from client roles |
| `20260901014234` | `per_user_job_status` | Move per-user job lifecycle state onto `job_analysis` |
| `20260901093525` | `idempotent_account_initialization` | `on conflict do nothing` in `handle_new_user` |
| `20260902101500` | `tenant_scoped_child_fks` | Composite `(id, user_id)` keys + `(child_id, user_id)` FKs so child rows cannot reference another tenant's parent |

## Applying new migrations

There is no local Supabase CLI stack wired up yet. New migrations are applied to
the remote project (via the Supabase MCP `apply_migration`, or the dashboard SQL
editor) and the exact SQL is committed here with the assigned version prefix.

## Regenerating types

`lib/supabase/database.types.ts` is generated from the remote schema. Regenerate
it whenever a migration changes tables/columns.
