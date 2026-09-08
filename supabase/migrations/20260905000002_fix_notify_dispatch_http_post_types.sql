-- ============================================================================
-- FIX #3: net.http_post's body parameter is jsonb, not text.
-- ============================================================================
-- Error hit at trigger-fire time (not at migration time — the trigger
-- and function were created successfully; this only surfaced the first
-- time an actual row update fired the trigger):
--
--   function net.http_post(url => text, headers => jsonb, body => text,
--   timeout_milliseconds => integer) does not exist
--
-- The body argument was being cast to ::text (json_build_object(...) is
-- json by default, and the function's previous version force-cast that
-- to text). pg_net's net.http_post expects body as jsonb — Postgres
-- doesn't implicitly coerce text to jsonb for function-overload
-- resolution, so with a text argument in that position, no matching
-- overload exists at all, regardless of what the other three arguments
-- look like.
--
-- Fixed by casting to ::jsonb instead. Only the function needs
-- redefining here, not the triggers themselves or the DO block that
-- created them — Postgres triggers call a function by name, not a frozen
-- copy of its body, so `create or replace function` alone updates every
-- trigger that already points at it.
--
-- If this still doesn't resolve it, the most direct way to settle any
-- remaining doubt about pg_net's exact installed signature on this
-- project (rather than guessing again) is to run:
--
--   select p.proname, pg_get_function_identity_arguments(p.oid)
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'net' and p.proname = 'http_post';
--
-- That returns the exact parameter names/types/order Postgres actually
-- has registered — compare it directly against the call below rather
-- than against anything documented or assumed.

create or replace function supabase_functions.http_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := TG_ARGV[0],
    headers := TG_ARGV[2]::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', case when TG_OP = 'DELETE' then null else row_to_json(NEW) end,
      'old_record', case when TG_OP = 'INSERT' then null else row_to_json(OLD) end
    )::jsonb,
    timeout_milliseconds := TG_ARGV[4]::int
  );
  return new;
end;
$$;
