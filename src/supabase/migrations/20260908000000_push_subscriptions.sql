-- ============================================================================
-- Device push registrations — the foundation for actual OS/browser push.
-- ============================================================================
-- Everything built so far (notifications table, Realtime, notify-dispatch)
-- delivers to this app's own in-app notification screen — nothing yet
-- reaches a device's system notification center or a browser's push
-- popup while the app isn't open. This table is what makes that
-- possible: one row per registered device/browser, so notify-dispatch
-- can look up where to actually send a push once a notification is
-- inserted.
--
-- One user can have many rows here (phone + tablet + a couple of
-- browser tabs on different machines) — that's normal, not a bug; a
-- push goes out to every one of them.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),

  -- Native (ios/android): the Expo push token itself, e.g.
  -- "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]".
  expo_push_token text,

  -- Web: the three pieces a Web Push subscription is made of. endpoint
  -- is the browser push service's unique URL for this subscription;
  -- p256dh/auth are the encryption keys required to send to it. All
  -- three travel together — there's no single "token" for web the way
  -- there is for Expo/native.
  web_endpoint text,
  web_p256dh text,
  web_auth text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A device shouldn't accumulate duplicate rows across app
  -- reinstalls/re-subscribes — re-registering the same token/endpoint
  -- updates the existing row (see the upsert pattern client code uses)
  -- rather than growing indefinitely.
  constraint push_subscriptions_expo_token_unique unique (expo_push_token),
  constraint push_subscriptions_web_endpoint_unique unique (web_endpoint),

  -- Exactly one of the two shapes populated, matching the row's own
  -- declared platform — a 'web' row with an expo_push_token (or vice
  -- versa) would silently never actually get used correctly.
  constraint push_subscriptions_shape_matches_platform check (
    (platform in ('ios', 'android') and expo_push_token is not null
      and web_endpoint is null and web_p256dh is null and web_auth is null)
    or
    (platform = 'web' and web_endpoint is not null and web_p256dh is not null and web_auth is not null
      and expo_push_token is null)
  )
);

create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notify-dispatch reads across users (it needs to find recipients'
-- devices, not just the acting user's own), the same reasoning as the
-- notification_settings broadcast-read policy — but this runs via the
-- Edge Function's service role key specifically, which already bypasses
-- RLS entirely, so no separate broad-read policy is needed here the way
-- notification_settings needed one for the client-side broadcast path.
-- This table should stay locked to "own rows only" for every other
-- caller — a device's push token/endpoint is more sensitive than a
-- boolean settings flag (it's effectively a way to send that specific
-- device a notification), so it doesn't get the same broader-read
-- treatment.
