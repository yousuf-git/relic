-- API roles have no USAGE on the managed `auth` schema and it cannot be granted
-- (owned by cloud_admin), so read the JWT subject through an owner-defined wrapper.
create or replace function public.current_user_id() returns uuid
language sql stable
security definer
set search_path = pg_catalog, pg_temp
as $$ select nullif(auth.user_id(), '')::uuid $$;

revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to authenticated;
