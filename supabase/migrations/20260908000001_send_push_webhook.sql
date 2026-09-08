-- ============================================================================
-- Webhook: trigger send-push on every notifications insert.
-- ============================================================================
-- Deliberately a separate trigger from notify-dispatch's 20, on a
-- different table (notifications itself, not the 20 source tables
-- notify-dispatch watches) — this way ANY notifications row, however it
-- got inserted (any of notify-dispatch's 21 handlers, or a client-side
-- addNotification call still active during the cutover), triggers a
-- push the same way. No need to touch notify-dispatch's own code at
-- all, and no risk of duplicating this logic across 21 call sites.
--
-- ----------------------------------------------------------------------
-- SETUP REQUIRED BEFORE RUNNING THIS — same pattern as
-- 20260905000000_notify_dispatch_webhooks.sql:
-- ----------------------------------------------------------------------
--   insert into private.app_config (key, value) values
--     ('send_push_function_url', 'https://<your-project-ref>.supabase.co/functions/v1/send-push'),
--     ('send_push_webhook_secret', '<the exact value from `supabase secrets set PUSH_WEBHOOK_SECRET=...`>')
--   on conflict (key) do update set value = excluded.value;
-- ----------------------------------------------------------------------

create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

alter table private.app_config enable row level security;

-- Reuses supabase_functions.http_request(), already created by the
-- notify-dispatch migrations — safe to re-declare with create or
-- replace even if this file runs standalone, before those.
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
    )::jsonb,
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
begin
  select value into function_url from private.app_config where key = 'send_push_function_url';
  select value into webhook_secret from private.app_config where key = 'send_push_webhook_secret';

  if function_url is null or webhook_secret is null then
    raise exception
      'private.app_config is missing send_push_function_url / send_push_webhook_secret. '
      'Run the setup INSERT in this file''s header comment first, then re-run this migration.';
  end if;

  headers := format(
    '{"Content-Type":"application/json","x-webhook-secret":"%s"}',
    webhook_secret
  );

  execute format('drop trigger if exists %I on public.notifications', 'send_push_on_notification');
  execute format(
    'create trigger %I after insert on public.notifications for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    'send_push_on_notification',
    function_url,
    'POST',
    headers,
    '{}',
    '5000'
  );
end $$;
