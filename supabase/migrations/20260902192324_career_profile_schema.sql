-- Phase 2 — Career Profile schema.
--
-- Turns the minimal Phase 1 placeholder tables into the structured, editable
-- source-of-truth Career Profile (D-002, D-020): personal information, work
-- experience + achievements, a normalized skill catalog, projects + project
-- skills, education, certifications, career preferences, and reusable
-- application answers.
--
-- Conventions (match Phase 1):
--   * every user-owned table has `user_id` + RLS "own rows"
--     (user_id = (select auth.uid()), to authenticated)
--   * every FK from a user-owned row to another user-owned row carries
--     `user_id` and references a composite (id, user_id) key on the parent
--     (D-018) — a cross-tenant reference fails at the database
--   * `source` records provenance so Phase 3 resume import can mark rows
--     'resume_import' without overwriting 'manual' data
--   * editable records carry `updated_at` maintained by set_updated_at()
--
-- `skill` becomes a shared canonical catalog (like `job`): one row per
-- distinct skill, readable by every signed-in user, joined to a profile via
-- `profile_skill` / `project_skill`.
--
-- Tables are effectively empty (a single base `profile` row for the existing
-- auth user), so columns are dropped and reshaped without a data backfill.

-- ===========================================================================
-- profile — extend the personal-information record
-- ===========================================================================
alter table public.profile
  add column headline   text,
  add column phone      text,
  add column summary    text,
  add column links      jsonb not null default '{}'::jsonb,
  add column source     text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  add column updated_at timestamptz not null default now(),
  drop column target_roles,
  drop column target_locations;

create trigger profile_set_updated_at
  before update on public.profile
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- career_preferences — one row per user; feeds discovery + matching later
-- ===========================================================================
create table public.career_preferences (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users (id) on delete cascade,
  profile_id         uuid not null,
  desired_roles      jsonb   not null default '[]'::jsonb,
  desired_locations  jsonb   not null default '[]'::jsonb,
  work_arrangements  jsonb   not null default '[]'::jsonb,
  employment_types   jsonb   not null default '[]'::jsonb,
  min_salary         integer check (min_salary is null or min_salary >= 0),
  salary_currency    text,
  salary_period      text check (salary_period in ('year', 'hour')),
  open_to_relocation boolean,
  availability       text
    check (availability in ('immediately', 'one_month', 'three_months', 'exploring')),
  seniority          text,
  notes              text,
  source             text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint career_preferences_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade
);
create index career_preferences_profile_id_idx on public.career_preferences (profile_id);

create trigger career_preferences_set_updated_at
  before update on public.career_preferences
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- experience — extend; becomes a composite-key parent of achievements
-- ===========================================================================
alter table public.experience
  add column location        text,
  add column employment_type text
    check (employment_type is null or employment_type in
      ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance')),
  add column source          text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  add column updated_at      timestamptz not null default now(),
  add constraint experience_id_user_id_key unique (id, user_id),
  add constraint experience_date_order_check
    check (end_date is null or start_date is null or end_date >= start_date);

create trigger experience_set_updated_at
  before update on public.experience
  for each row execute function public.set_updated_at();

create table public.experience_achievement (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  experience_id uuid not null,
  content       text not null,
  sort_order    integer not null default 0,
  source        text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint experience_achievement_experience_id_fkey
    foreign key (experience_id, user_id)
    references public.experience (id, user_id) on delete cascade
);
create index experience_achievement_user_id_idx
  on public.experience_achievement (user_id);
create index experience_achievement_experience_id_idx
  on public.experience_achievement (experience_id);

create trigger experience_achievement_set_updated_at
  before update on public.experience_achievement
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- skill — reshape per-user rows into a shared canonical catalog
-- ===========================================================================
drop policy "own rows" on public.skill;
drop index if exists public.skill_user_id_idx;
drop index if exists public.skill_profile_id_idx;

alter table public.skill
  drop constraint skill_user_id_fkey,
  drop constraint skill_profile_id_fkey,
  drop column user_id,
  drop column profile_id,
  add column slug text;

-- Empty in practice; this keeps the migration valid if a row ever slipped in.
-- Must stay in sync with slugifySkill() in lib/profile/skills.ts.
update public.skill
  set slug = trim(both '-' from regexp_replace(
    replace(replace(lower(coalesce(name, '')), '+', 'p'), '#', 'sharp'),
    '[^a-z0-9]+', '-', 'g'));

alter table public.skill
  alter column name set not null,
  alter column slug set not null,
  add constraint skill_slug_key unique (slug);

-- Catalog is world-readable to signed-in users and append-only for them.
-- Curation / merges / deletes are a service-role concern.
create policy "authenticated can read skills" on public.skill
  for select to authenticated using (true);
create policy "authenticated can add skills" on public.skill
  for insert to authenticated with check (true);

insert into public.skill (name, slug, category) values
  ('JavaScript', 'javascript', 'language'),
  ('TypeScript', 'typescript', 'language'),
  ('Python', 'python', 'language'),
  ('Java', 'java', 'language'),
  ('C#', 'csharp', 'language'),
  ('C++', 'cpp', 'language'),
  ('Go', 'go', 'language'),
  ('Rust', 'rust', 'language'),
  ('Ruby', 'ruby', 'language'),
  ('PHP', 'php', 'language'),
  ('Swift', 'swift', 'language'),
  ('Kotlin', 'kotlin', 'language'),
  ('Scala', 'scala', 'language'),
  ('SQL', 'sql', 'language'),
  ('Bash', 'bash', 'language'),
  ('HTML', 'html', 'language'),
  ('CSS', 'css', 'language'),
  ('React', 'react', 'framework'),
  ('Next.js', 'next-js', 'framework'),
  ('Vue.js', 'vue-js', 'framework'),
  ('Angular', 'angular', 'framework'),
  ('Svelte', 'svelte', 'framework'),
  ('Node.js', 'node-js', 'framework'),
  ('Express', 'express', 'framework'),
  ('NestJS', 'nestjs', 'framework'),
  ('Django', 'django', 'framework'),
  ('Flask', 'flask', 'framework'),
  ('FastAPI', 'fastapi', 'framework'),
  ('Ruby on Rails', 'ruby-on-rails', 'framework'),
  ('Spring Boot', 'spring-boot', 'framework'),
  ('.NET', 'net', 'framework'),
  ('Laravel', 'laravel', 'framework'),
  ('React Native', 'react-native', 'framework'),
  ('Flutter', 'flutter', 'framework'),
  ('Tailwind CSS', 'tailwind-css', 'framework'),
  ('GraphQL', 'graphql', 'framework'),
  ('PostgreSQL', 'postgresql', 'database'),
  ('MySQL', 'mysql', 'database'),
  ('SQLite', 'sqlite', 'database'),
  ('MongoDB', 'mongodb', 'database'),
  ('Redis', 'redis', 'database'),
  ('Elasticsearch', 'elasticsearch', 'database'),
  ('DynamoDB', 'dynamodb', 'database'),
  ('Supabase', 'supabase', 'database'),
  ('Firebase', 'firebase', 'database'),
  ('Prisma', 'prisma', 'database'),
  ('Amazon Web Services', 'amazon-web-services', 'cloud'),
  ('Google Cloud Platform', 'google-cloud-platform', 'cloud'),
  ('Microsoft Azure', 'microsoft-azure', 'cloud'),
  ('Vercel', 'vercel', 'cloud'),
  ('Cloudflare', 'cloudflare', 'cloud'),
  ('Docker', 'docker', 'devops'),
  ('Kubernetes', 'kubernetes', 'devops'),
  ('Terraform', 'terraform', 'devops'),
  ('GitHub Actions', 'github-actions', 'devops'),
  ('CI/CD', 'ci-cd', 'devops'),
  ('Linux', 'linux', 'devops'),
  ('Nginx', 'nginx', 'devops'),
  ('Git', 'git', 'tool'),
  ('Jira', 'jira', 'tool'),
  ('Figma', 'figma', 'tool'),
  ('Postman', 'postman', 'tool'),
  ('Datadog', 'datadog', 'tool'),
  ('Sentry', 'sentry', 'tool'),
  ('REST APIs', 'rest-apis', 'practice'),
  ('Microservices', 'microservices', 'practice'),
  ('Test-Driven Development', 'test-driven-development', 'practice'),
  ('Agile', 'agile', 'practice'),
  ('Scrum', 'scrum', 'practice'),
  ('System Design', 'system-design', 'practice'),
  ('Code Review', 'code-review', 'practice'),
  ('Accessibility', 'accessibility', 'practice'),
  ('Performance Optimization', 'performance-optimization', 'practice'),
  ('Unit Testing', 'unit-testing', 'practice'),
  ('Jest', 'jest', 'tool'),
  ('Vitest', 'vitest', 'tool'),
  ('Playwright', 'playwright', 'tool'),
  ('Cypress', 'cypress', 'tool'),
  ('Machine Learning', 'machine-learning', 'data'),
  ('Data Analysis', 'data-analysis', 'data'),
  ('Pandas', 'pandas', 'data'),
  ('NumPy', 'numpy', 'data'),
  ('PyTorch', 'pytorch', 'data'),
  ('TensorFlow', 'tensorflow', 'data'),
  ('Apache Airflow', 'apache-airflow', 'data'),
  ('dbt', 'dbt', 'data'),
  ('Snowflake', 'snowflake', 'data'),
  ('Tableau', 'tableau', 'data'),
  ('Power BI', 'power-bi', 'data'),
  ('Product Management', 'product-management', 'business'),
  ('Project Management', 'project-management', 'business'),
  ('Technical Writing', 'technical-writing', 'business'),
  ('UX Design', 'ux-design', 'design'),
  ('UI Design', 'ui-design', 'design'),
  ('User Research', 'user-research', 'design'),
  ('Communication', 'communication', 'soft'),
  ('Leadership', 'leadership', 'soft'),
  ('Mentoring', 'mentoring', 'soft'),
  ('Problem Solving', 'problem-solving', 'soft'),
  ('Collaboration', 'collaboration', 'soft')
on conflict (slug) do nothing;

-- ===========================================================================
-- profile_skill — a user's skills, linked to the catalog
-- ===========================================================================
create table public.profile_skill (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  profile_id       uuid not null,
  skill_id         uuid not null references public.skill (id) on delete cascade,
  proficiency      text
    check (proficiency is null or proficiency in
      ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience numeric(4, 1)
    check (years_experience is null or years_experience >= 0),
  source           text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profile_skill_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade,
  constraint profile_skill_profile_id_skill_id_key unique (profile_id, skill_id)
);
create index profile_skill_user_id_idx on public.profile_skill (user_id);
create index profile_skill_skill_id_idx on public.profile_skill (skill_id);

create trigger profile_skill_set_updated_at
  before update on public.profile_skill
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- project — extend; becomes a composite-key parent of project_skill
-- ===========================================================================
alter table public.project
  add column role       text,
  add column start_date date,
  add column end_date   date,
  add column source     text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  add column updated_at timestamptz not null default now(),
  drop column tech_stack,
  add constraint project_id_user_id_key unique (id, user_id),
  add constraint project_date_order_check
    check (end_date is null or start_date is null or end_date >= start_date);

create trigger project_set_updated_at
  before update on public.project
  for each row execute function public.set_updated_at();

create table public.project_skill (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  skill_id   uuid not null references public.skill (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint project_skill_project_id_fkey
    foreign key (project_id, user_id)
    references public.project (id, user_id) on delete cascade,
  constraint project_skill_project_id_skill_id_key unique (project_id, skill_id)
);
create index project_skill_user_id_idx on public.project_skill (user_id);
create index project_skill_skill_id_idx on public.project_skill (skill_id);

-- ===========================================================================
-- education — extend
-- ===========================================================================
alter table public.education
  add column field_of_study text,
  add column grade          text,
  add column description     text,
  add column source          text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  add column updated_at      timestamptz not null default now(),
  add constraint education_date_order_check
    check (end_date is null or start_date is null or end_date >= start_date);

create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- certification — new
-- ===========================================================================
create table public.certification (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  profile_id     uuid not null,
  name           text not null,
  issuer         text,
  issued_on      date,
  expires_on     date,
  credential_id  text,
  credential_url text,
  source         text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint certification_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade,
  constraint certification_date_order_check
    check (expires_on is null or issued_on is null or expires_on >= issued_on)
);
create index certification_user_id_idx on public.certification (user_id);
create index certification_profile_id_idx on public.certification (profile_id);

create trigger certification_set_updated_at
  before update on public.certification
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- application_answer — reusable answers to common application questions
-- ===========================================================================
-- Stored verbatim from the user. `is_sensitive` marks answers (work
-- authorization, sponsorship, compensation, EEO/demographic) that downstream
-- assisted apply (Phase 10) must surface for explicit review and never
-- auto-fill or fabricate (architecture invariant 7).
create table public.application_answer (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  profile_id   uuid not null,
  question     text not null,
  answer       text,
  category     text not null default 'general'
    check (category in ('general', 'work_authorization', 'sponsorship',
                        'compensation', 'demographic_eeo', 'logistics', 'other')),
  is_sensitive boolean not null default false,
  source       text not null default 'manual'
    check (source in ('manual', 'resume_import', 'ai_suggested', 'oauth')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint application_answer_profile_id_fkey
    foreign key (profile_id, user_id)
    references public.profile (id, user_id) on delete cascade
);
create index application_answer_user_id_idx on public.application_answer (user_id);
create index application_answer_profile_id_idx on public.application_answer (profile_id);

create trigger application_answer_set_updated_at
  before update on public.application_answer
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- RLS — "own rows" on every new user-owned table
-- ===========================================================================
alter table public.career_preferences     enable row level security;
alter table public.experience_achievement enable row level security;
alter table public.profile_skill          enable row level security;
alter table public.project_skill          enable row level security;
alter table public.certification          enable row level security;
alter table public.application_answer     enable row level security;

create policy "own rows" on public.career_preferences
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.experience_achievement
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.profile_skill
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.project_skill
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.certification
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.application_answer
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
