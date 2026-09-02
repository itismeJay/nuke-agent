-- Make account initialization idempotent.
--
-- handle_new_user() fires on auth.users insert and seeds the two required
-- base rows (profile, agent_settings). The original version used plain
-- INSERTs: a retry/replay, a manual re-run, or an app-side fallback calling
-- the same logic would raise a unique-violation and abort. Adding
-- ON CONFLICT DO NOTHING makes re-execution safe and lets an application-side
-- fallback share the exact same seeding contract.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (user_id, full_name, email)
    values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
    on conflict (user_id) do nothing;
  insert into public.agent_settings (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
