-- Multi-tenant base schema for the career agent.
-- job is shared discovery data; every other table is user-owned + RLS-protected.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profile (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  full_name         text,
  email             text,
  location          text,
  target_roles      jsonb not null default '[]'::jsonb,
  target_locations  jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

create table public.experience (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  profile_id  uuid not null references public.profile (id) on delete cascade,
  company     text,
  title       text,
  start_date  date,
  end_date    date,
  description text,
  created_at  timestamptz not null default now()
);
create index experience_user_id_idx on public.experience (user_id);
create index experience_profile_id_idx on public.experience (profile_id);

create table public.project (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  profile_id  uuid not null references public.profile (id) on delete cascade,
  name        text,
  description text,
  tech_stack  jsonb not null default '[]'::jsonb,
  url         text,
  created_at  timestamptz not null default now()
);
create index project_user_id_idx on public.project (user_id);
create index project_profile_id_idx on public.project (profile_id);

create table public.skill (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  profile_id  uuid not null references public.profile (id) on delete cascade,
  name        text,
  category    text,
  created_at  timestamptz not null default now()
);
create index skill_user_id_idx on public.skill (user_id);
create index skill_profile_id_idx on public.skill (profile_id);

create table public.education (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  profile_id  uuid not null references public.profile (id) on delete cascade,
  institution text,
  degree      text,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);
create index education_user_id_idx on public.education (user_id);
create index education_profile_id_idx on public.education (profile_id);

create table public.master_resume (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  profile_id  uuid not null references public.profile (id) on delete cascade,
  file_url    text,
  uploaded_at timestamptz not null default now()
);
create index master_resume_user_id_idx on public.master_resume (user_id);
create index master_resume_profile_id_idx on public.master_resume (profile_id);

create table public.job (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  company     text,
  description text,
  source_url  text unique,
  source      text,
  status      text not null default 'discovered'
    check (status in ('discovered', 'scored', 'queued', 'applied', 'skipped')),
  posted_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index job_status_idx on public.job (status);

create table public.job_analysis (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  job_id           uuid not null references public.job (id) on delete cascade,
  required_skills  jsonb not null default '[]'::jsonb,
  preferred_skills jsonb not null default '[]'::jsonb,
  match_score      integer check (match_score between 0 and 100),
  created_at       timestamptz not null default now(),
  unique (user_id, job_id)
);
create index job_analysis_user_id_idx on public.job_analysis (user_id);
create index job_analysis_job_id_idx on public.job_analysis (job_id);

create table public.resume_version (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  job_id     uuid not null references public.job (id) on delete cascade,
  content    jsonb not null default '{}'::jsonb,
  pdf_url    text,
  created_at timestamptz not null default now()
);
create index resume_version_user_id_idx on public.resume_version (user_id);
create index resume_version_job_id_idx on public.resume_version (job_id);

create table public.application (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  resume_version_id uuid not null references public.resume_version (id) on delete cascade,
  status            text not null default 'applied'
    check (status in ('applied', 'interview', 'rejected', 'offer')),
  mode              text not null default 'manual'
    check (mode in ('manual', 'auto')),
  applied_at        timestamptz not null default now(),
  notes             text
);
create index application_user_id_idx on public.application (user_id);
create index application_resume_version_id_idx on public.application (resume_version_id);

create table public.agent_settings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  enabled           boolean not null default false,
  min_match_score   integer not null default 75 check (min_match_score between 0 and 100),
  daily_apply_limit integer not null default 5 check (daily_apply_limit >= 0),
  updated_at        timestamptz not null default now()
);
create trigger agent_settings_set_updated_at
  before update on public.agent_settings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profile (user_id, full_name, email)
    values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  insert into public.agent_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profile        enable row level security;
alter table public.experience     enable row level security;
alter table public.project        enable row level security;
alter table public.skill          enable row level security;
alter table public.education       enable row level security;
alter table public.master_resume  enable row level security;
alter table public.job            enable row level security;
alter table public.job_analysis   enable row level security;
alter table public.resume_version enable row level security;
alter table public.application    enable row level security;
alter table public.agent_settings enable row level security;

create policy "own rows" on public.profile
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.experience
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.project
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.skill
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.education
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.master_resume
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.job_analysis
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.resume_version
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.application
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.agent_settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "authenticated can read shared jobs" on public.job
  for select to authenticated
  using (true);
