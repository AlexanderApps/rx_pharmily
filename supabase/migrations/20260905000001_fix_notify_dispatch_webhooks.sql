-- ============================================================================
-- FIX #2: config storage that doesn't need superuser privileges.
-- ============================================================================
-- The GUC-based approach in this file's previous version
-- (current_setting('app.notify_function_url', ...), set via
-- `alter database postgres set ...`) doesn't work on Supabase: the
-- `postgres` role you get on a Supabase project is a restricted,
-- platform-managed role, not a true Postgres superuser — and setting a
-- custom database-level parameter requires superuser rights. Hence:
-- "ERROR: 42501: permission denied to set parameter".
--
-- This replaces that with a plain table instead — CREATE TABLE, INSERT,
-- and SELECT only need ordinary privileges, which every other migration
-- in this project already relies on successfully. Locked down with RLS
-- enabled and zero policies: nothing reaches it through the normal
-- authenticated/anon/PostgREST path at all. The table's owner (the role
-- that ran `CREATE TABLE`, i.e. whatever runs `supabase db push`)
-- bypasses RLS by default unless FORCE ROW LEVEL SECURITY is set — which
-- it deliberately isn't here, so migrations and admin sessions can still
-- read it directly.
--
-- ----------------------------------------------------------------------
-- SETUP REQUIRED BEFORE RUNNING THIS — ONE TIME, PER ENVIRONMENT, NEVER
-- COMMITTED TO VERSION CONTROL:
-- ----------------------------------------------------------------------
-- Run this in the SQL editor (or `supabase db execute`) with your real
-- values, BEFORE running this migration:
--
--   create schema if not exists private;
--   create table if not exists private.app_config (
--     key text primary key,
--     value text not null
--   );
--   alter table private.app_config enable row level security;
--
--   insert into private.app_config (key, value) values
--     ('notify_function_url', 'https://<your-project-ref>.supabase.co/functions/v1/notify-dispatch'),
--     ('notify_webhook_secret', '<the exact value from `supabase secrets set NOTIFY_WEBHOOK_SECRET=...`>')
--   on conflict (key) do update set value = excluded.value;
--
-- (The schema/table/RLS setup only needs to happen once per project —
-- the migration below also creates them defensively with IF NOT EXISTS,
-- so it's harmless if you've already run this by hand. Only the INSERT
-- with your real values needs to happen outside version control.)
-- ----------------------------------------------------------------------

create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

alter table private.app_config enable row level security;

create schema if not exists "supabase_functions";
create extension if not exists "pg_net" with schema "extensions";

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
    )::text,
    timeout_milliseconds := TG_ARGV[4]::int
  );
  return new;
end;
$$;

do $$
declare
  function_url text;
  webhook_secret text;
  headers text;
  webhook record;
begin
  select value into function_url from private.app_config where key = 'notify_function_url';
  select value into webhook_secret from private.app_config where key = 'notify_webhook_secret';

  if function_url is null or webhook_secret is null then
    raise exception
      'private.app_config is missing notify_function_url / notify_webhook_secret. '
      'Run the setup INSERT in this file''s header comment first, then '
      're-run this migration.';
  end if;

  headers := format(
    '{"Content-Type":"application/json","x-webhook-secret":"%s"}',
    webhook_secret
  );

  for webhook in
    select * from (values
      ('rxrfqs', 'update'),
      ('rxrfq_responses', 'insert'),
      ('donations', 'insert'),
      ('donation_responses', 'insert or update'),
      ('mediscope_requests', 'update'),
      ('mediscope_responses', 'insert'),
      ('jobs', 'insert'),
      ('job_applications', 'insert or update'),
      ('ads', 'update'),
      ('ad_comments', 'insert'),
      ('consult_responses', 'insert'),
      ('pharmacist_answers', 'insert'),
      ('rxlink_requests', 'insert'),
      ('rxlink_responses', 'insert'),
      ('formulary_requests', 'update'),
      ('facility_membership_requests', 'insert or update'),
      ('facility_creation_requests', 'update'),
      ('organization_creation_requests', 'update'),
      ('facility_organization_requests', 'insert or update'),
      ('profiles', 'update')
    ) as t(table_name, events)
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'notify_dispatch_' || webhook.table_name,
      webhook.table_name
    );
    execute format(
      'create trigger %I after %s on public.%I for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
      'notify_dispatch_' || webhook.table_name,
      webhook.events,
      webhook.table_name,
      function_url,
      'POST',
      headers,
      '{}',
      '5000'
    );
  end loop;
end $$;
