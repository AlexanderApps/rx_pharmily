-- ============================================================================
-- Enable Realtime on notifications, for live in-app delivery.
-- ============================================================================
-- Without this, a client only ever sees notifications from its last
-- fetchNotifications() call — nothing arrives until the screen is
-- reopened or the app reloads. This adds the table to Supabase's
-- realtime publication so subscribed clients receive new rows the
-- moment they're inserted.
--
-- Wrapped in a check against pg_publication_tables rather than a bare
-- "alter publication ... add table" — Postgres has no native
-- "if not exists" for this specific statement, and this migration
-- should be safe to re-run (same reasoning as every other migration
-- this feature has needed: partial-application recovery matters more
-- here than it would for a brand-new table).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Realtime's postgres_changes subscriptions enforce each table's own RLS
-- policies against the connecting user's JWT — the existing "recipient
-- sees own notifications" select policy already restricts this
-- correctly, so no new policy is needed here. The client subscription
-- additionally filters by user_id for efficiency (narrowing what
-- Realtime evaluates per row), but RLS is what actually enforces it.
