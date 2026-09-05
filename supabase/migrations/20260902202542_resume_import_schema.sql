-- Phase 3 — Master Resume Import, Re-import & Inngest Resume Processing.
--
-- Resumes ENRICH the Career Profile through reviewed proposals; the uploaded
-- file never becomes the source of truth (D-002, D-003). A résumé upload is
-- never required (D-020).
--
-- This migration:
--   * turns `master_resume` into an immutable, ownership-scoped upload record
--     with a parse-state machine and a per-user "primary" flag
--   * adds `resume_import` (one parse + review run) and `resume_import_item`
--     (one reviewable proposed fact, classified NEW / CHANGED / UNCHANGED /
--     CONFLICT against the current profile)
--   * creates the private `master-resumes` Storage bucket + owner-scoped,
--     insert-once (no UPDATE / DELETE) object policies
--
-- Conventions (match Phase 1 / 2):
--   * every user-owned table has `user_id` + RLS "own rows"
--     (user_id = (select auth.uid()), to authenticated)
--   * every FK from a user-owned row to another user-owned row carries
--     `user_id` and references a composite (id, user_id) key on the parent
--     (D-018) — a cross-tenant reference fails at the database
--   * `source = 'resume_import'` on any profile row a merge writes
--   * editable records carry `updated_at` maintained by set_updated_at()
--
-- `master_resume` is empty at apply time, so NOT NULL columns are added
-- directly with no backfill.

-- ===========================================================================
-- master_resume — immutable uploaded source document + parse state
-- ===========================================================================
alter table public.master_resume
  drop column file_url,
  add column storage_bucket     text not null default 'master-resumes',
  add column storage_path       text not null,
  add column original_filename  text not null,
  add column content_type       text not null default 'application/pdf',
  add column byte_size          integer not null check (byte_size > 0),
  add column checksum           text,
  add column page_count         integer check (page_count is null or page_count >= 0),
  add column is_primary         boolean not null default false,
  add column parse_status       text not null default 'pending'
    check (parse_status in ('pending', 'processing', 'parsed', 'failed')),
  add column parse_error        text,
  add column parsed_at          timestamptz,
  add column updated_at         timestamptz not null default now(),
  add constraint master_resume_id_user_id_key unique (id, user_id),
  add constraint master_resume_storage_path_key unique (storage_path);

-- One primary résumé per user (a partial unique index).
create unique index master_resume_one_primary_per_user
  on public.master_resume (user_id) where is_primary;

create trigger master_resume_set_updated_at
  before update on public.master_resume
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- resume_import — one asynchronous parse + review run for a master_resume
-- ===========================================================================
create table public.resume_import (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  master_resume_id  uuid not null,
  profile_id        uuid not null,
  status            text not null default 'queued'
    check (status in ('queued', 'extracting', 'parsing', 'ready_for_review',
                      'applied', 'failed', 'discarded')),
  -- Provenance for the extraction + the deterministic diff that produced the
  -- proposal. `extracted` is the raw, Zod-validated AI output and is written
  -- exactly once.
  model             text,
  prompt_version    text,
  algorithm_version text,
  extracted         jsonb,
  token_usage       jsonb,
  raw_text_chars    integer,
  error             text,
  idempotency_key   text not null unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  applied_at        timestamptz,
  constraint resume_import_master_resume_id_fkey
    foreign key (master_resume_id, user_id)
    references public.master_resume (id, user_id) on delete cascade,
  constraint resume_import_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade,
  constraint resume_import_id_user_id_key unique (id, user_id)
);
create index resume_import_user_id_idx on public.resume_import (user_id);
create index resume_import_master_resume_id_idx
  on public.resume_import (master_resume_id);
create index resume_import_status_idx on public.resume_import (user_id, status);

create trigger resume_import_set_updated_at
  before update on public.resume_import
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- resume_import_item — one reviewable proposed fact
-- ===========================================================================
-- `classification` is computed deterministically (D-006) by comparing the
-- extracted fact to the CURRENT profile at proposal time:
--   new       — no matching profile record / empty field
--   changed   — matched record, résumé fills a gap or adds detail
--   unchanged — matched record, no material difference (never written)
--   conflict  — matched record, résumé contradicts or is less precise than
--               existing data (user must choose explicitly)
-- `confidence = 'low'` marks anything the model was unsure of or a weak match;
-- low-confidence items are never pre-selected and are never auto-applied.
create table public.resume_import_item (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  resume_import_id uuid not null,
  entity_type      text not null
    check (entity_type in ('personal_info', 'summary', 'experience',
                           'experience_achievement', 'skill', 'project',
                           'education', 'certification')),
  classification   text not null
    check (classification in ('new', 'changed', 'unchanged', 'conflict')),
  field            text,
  proposed         jsonb not null,
  current          jsonb,
  match_target_id     uuid,
  match_target_table  text,
  confidence       text not null default 'high'
    check (confidence in ('high', 'low')),
  recommended      boolean not null default true,
  decision         text not null default 'pending'
    check (decision in ('pending', 'accepted', 'rejected', 'edited')),
  applied_value    jsonb,
  applied_row_id   uuid,
  applied_at       timestamptz,
  apply_error      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint resume_import_item_resume_import_id_fkey
    foreign key (resume_import_id, user_id)
    references public.resume_import (id, user_id) on delete cascade
);
create index resume_import_item_user_id_idx
  on public.resume_import_item (user_id);
create index resume_import_item_resume_import_id_idx
  on public.resume_import_item (resume_import_id);

create trigger resume_import_item_set_updated_at
  before update on public.resume_import_item
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- RLS — "own rows" on the new user-owned tables
-- ===========================================================================
alter table public.resume_import      enable row level security;
alter table public.resume_import_item enable row level security;

create policy "own rows" on public.resume_import
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.resume_import_item
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ===========================================================================
-- Storage — private `master-resumes` bucket + owner-scoped object policies
-- ===========================================================================
-- Object key layout: {user_id}/{uuid}.pdf  — so the first path segment is the
-- owner. Policies allow an owner to read and create their own objects only;
-- there is deliberately NO update or delete policy, so an uploaded original is
-- immutable (D-003) and import history is never destroyed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('master-resumes', 'master-resumes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "master-resumes: owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'master-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "master-resumes: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'master-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
