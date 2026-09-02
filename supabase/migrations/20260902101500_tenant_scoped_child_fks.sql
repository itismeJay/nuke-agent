-- Tenant-scope every foreign key that points from a user-owned row to another
-- user-owned row.
--
-- Before this migration the RLS "own rows" policy checked `user_id = auth.uid()`
-- on the row being written, but nothing checked that the *referenced* parent
-- belonged to the same user. An authenticated user could insert e.g. an
-- `experience` with their own `user_id` and another user's `profile_id`
-- (profile UUIDs become discoverable as the product grows). The WITH CHECK
-- passed, so the cross-tenant row was written -- violating the invariant that
-- child records cannot cross tenant boundaries.
--
-- Fix: give each user-owned parent a composite UNIQUE (id, user_id) and make
-- every child FK reference (parent_id, user_id) instead of just (parent_id).
-- A cross-tenant reference then fails the foreign key at the database level,
-- independent of RLS.
--
-- Tables are empty at apply time (only the base profile/agent_settings rows for
-- existing auth users exist), so no data backfill is required.

-- --- Parents: composite unique keys -----------------------------------------
alter table public.profile
  add constraint profile_id_user_id_key unique (id, user_id);

alter table public.resume_version
  add constraint resume_version_id_user_id_key unique (id, user_id);

-- --- profile children: (profile_id, user_id) -> profile (id, user_id) -------
alter table public.experience
  drop constraint experience_profile_id_fkey,
  add constraint experience_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade;

alter table public.project
  drop constraint project_profile_id_fkey,
  add constraint project_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade;

alter table public.skill
  drop constraint skill_profile_id_fkey,
  add constraint skill_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade;

alter table public.education
  drop constraint education_profile_id_fkey,
  add constraint education_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade;

alter table public.master_resume
  drop constraint master_resume_profile_id_fkey,
  add constraint master_resume_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade;

-- --- resume_version child: (resume_version_id, user_id) --------------------
alter table public.application
  drop constraint application_resume_version_id_fkey,
  add constraint application_resume_version_id_fkey
    foreign key (resume_version_id, user_id)
    references public.resume_version (id, user_id) on delete cascade;
