-- Harden trigger functions: explicit SECURITY INVOKER where elevation is not
-- needed, pinned empty search_path, and no EXECUTE grant to client-facing roles.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
