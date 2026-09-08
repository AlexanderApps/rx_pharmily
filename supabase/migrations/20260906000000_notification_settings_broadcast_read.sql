-- ============================================================================
-- Relax notification_settings' select policy for client-side broadcast.
-- ============================================================================
-- The existing "users manage their own notification settings" policy is
-- FOR ALL with user_id = auth.uid() on both using and with check — which
-- means a regular authenticated client can only ever SELECT its own row,
-- never another user's. useNotificationStore.getState().
-- addBroadcastNotification() needs to see every opted-in user's row to
-- know who to notify, and RLS was silently defeating that: the query
-- always came back with, at most, [the acting user's own id] — never
-- anyone else's — regardless of how many other accounts had actually
-- opted in. Every broadcast category still running through the
-- client-side path (i.e. any table whose webhook hasn't been set up yet
-- per supabase/functions/notify-dispatch/README.md) was affected.
--
-- Splitting the one FOR ALL policy into two: inserts/updates/deletes stay
-- restricted to a user's own row (unchanged behavior), selects open up to
-- any authenticated user. This data isn't sensitive — a boolean opt-in
-- flag per notification category, not message content or personal
-- details — so broadening read access is a reasonable, low-risk fix
-- rather than something that needs a more elaborate access-control
-- scheme.
--
-- Once every category's webhook is live and its client-side call
-- removed (the Edge Function uses the service role key, which bypasses
-- RLS entirely and never had this problem), this broader select policy
-- becomes unnecessary — but it's harmless to leave in place; it doesn't
-- expose anything more sensitive later than it does today.

drop policy if exists "users manage their own notification settings" on public.notification_settings;
drop policy if exists "users write their own notification settings" on public.notification_settings;
drop policy if exists "users update their own notification settings" on public.notification_settings;
drop policy if exists "users delete their own notification settings" on public.notification_settings;
drop policy if exists "any authenticated user reads notification settings" on public.notification_settings;

create policy "users write their own notification settings"
  on public.notification_settings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users update their own notification settings"
  on public.notification_settings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete their own notification settings"
  on public.notification_settings for delete
  to authenticated
  using (user_id = auth.uid());

create policy "any authenticated user reads notification settings"
  on public.notification_settings for select
  to authenticated
  using (true);
