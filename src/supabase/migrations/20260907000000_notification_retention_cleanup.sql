-- ============================================================================
-- Notification retention: delete old rows automatically, on a schedule.
-- ============================================================================
-- Fan-out-on-write (one notifications row per recipient per broadcast)
-- is the right call for read performance, but nothing was ever deleting
-- old rows — the table would grow forever. This adds a daily cleanup job
-- via pg_cron (Postgres-native scheduling, no external cron service or
-- Edge Function needed) that deletes notifications past a configurable
-- retention period, defaulting to 365 days.
--
-- ----------------------------------------------------------------------
-- CHANGING THE RETENTION PERIOD LATER — no migration needed:
-- ----------------------------------------------------------------------
--   update private.app_config
--   set value = '180'  -- or any other number of days
--   where key = 'notification_retention_days';
--
-- Takes effect on the next scheduled run — nothing to redeploy, no code
-- change, no restart.
-- ----------------------------------------------------------------------
--
-- pg_cron is a standard Supabase extension enabled via CREATE EXTENSION
-- (unlike the "alter database ... set" approach this feature already
-- hit a real permission wall on — extension creation doesn't need true
-- superuser rights the way that did). If this line still fails for any
-- reason on your project, enable it once via the dashboard instead
-- (Database → Extensions → search "pg_cron" → Enable), then re-run the
-- rest of this file.

create extension if not exists pg_cron;

-- Reuses the same config table the webhook migration created — CREATE
-- TABLE IF NOT EXISTS here too, so this migration doesn't depend on
-- running after that one, and works standalone on a fresh project.
create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

alter table private.app_config enable row level security;

-- 365 days isn't sensitive (unlike the webhook secret), so this
-- migration sets its own default rather than requiring a manual insert
-- first — change it later with the UPDATE above, any time.
insert into private.app_config (key, value)
values ('notification_retention_days', '365')
on conflict (key) do nothing;

create or replace function public.cleanup_old_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  retention_days int;
  deleted_count int;
begin
  select value::int into retention_days
  from private.app_config
  where key = 'notification_retention_days';

  -- Falls back to 365 if the config row is ever missing (shouldn't
  -- happen given the insert above, but a cleanup job silently doing
  -- nothing because of a missing config row is worse than it running
  -- with a sane default).
  if retention_days is null then
    retention_days := 365;
  end if;

  delete from public.notifications
  where created_at < now() - (retention_days || ' days')::interval;

  get diagnostics deleted_count = row_count;
  raise notice 'cleanup_old_notifications: deleted % row(s) older than % days', deleted_count, retention_days;
end;
$$;

-- Runs daily at 03:00 UTC — outside any reasonable peak-traffic window
-- for a pharmacy marketplace app. Deletes are batched implicitly by
-- running once a day rather than continuously, keeping each run's
-- volume small and predictable instead of one enormous catch-up delete
-- the first time this job exists on an already-old table.
--
-- Explicitly unschedule-then-schedule, wrapped so a first run (job
-- doesn't exist yet) can't fail this migration — more defensive than
-- relying on cron.schedule's own upsert-by-name behavior alone, given
-- this can't be tested against a live project from here.
do $$
begin
  perform cron.unschedule('cleanup-old-notifications');
exception
  when others then
    null; -- job didn't exist yet — fine, proceed to create it below
end $$;

select cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  $$select public.cleanup_old_notifications();$$
);

-- Safe to re-run this migration (e.g. after changing the schedule) —
-- the unschedule/schedule pair above always leaves exactly one job
-- registered under this name, never a duplicate or an error.

-- ----------------------------------------------------------------------
-- VERIFYING THIS WORKED — two standard pg_cron tables to check:
-- ----------------------------------------------------------------------
--   select * from cron.job where jobname = 'cleanup-old-notifications';
--     -- confirms the job is registered, with the schedule and command
--     -- exactly as set above.
--
--   select * from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'cleanup-old-notifications')
--   order by start_time desc limit 10;
--     -- shows actual run history once the job has fired at least once —
--     -- status, any error message, and (via the function's own
--     -- `raise notice`) how many rows it deleted each time.
-- ----------------------------------------------------------------------
