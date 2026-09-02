-- Move per-user job lifecycle state off the shared `job` table.
--
-- `job` is shared across all users (postings are public data). A per-user
-- lifecycle column there is wrong: one user applying would flip the status for
-- everyone. Only "this posting exists / was discovered" is genuinely shared —
-- and that is implied by the row existing at all.
--
-- Per-user state (scored -> queued -> applied -> skipped) now lives on
-- `job_analysis`, which is already one row per (user_id, job_id).

-- --- job: drop the shared lifecycle column -------------------------------------
drop index if exists public.job_status_idx;
alter table public.job drop column if exists status;

-- --- job_analysis: add the per-user lifecycle column --------------------------
alter table public.job_analysis
  add column status text not null default 'scored'
    check (status in ('scored', 'queued', 'applied', 'skipped'));

create index job_analysis_status_idx on public.job_analysis (user_id, status);
