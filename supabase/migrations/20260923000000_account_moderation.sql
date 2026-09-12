-- ============================================================================
-- Account moderation: banning and suspension.
-- ============================================================================
-- Banning is permanent; suspension is temporary with a duration. Both
-- apply to any of the 3 entity types this app already treats uniformly
-- elsewhere (profile_update_requests, phone verification) — reusing the
-- existing profile_update_entity_type enum rather than defining a new,
-- parallel one for the same three values.
--
-- Two things live side by side, deliberately:
--   1. Denormalized is_banned/is_suspended/suspended_until columns
--      directly on profiles/facilities/organizations — this is what
--      makes a login/access check fast: it's already part of the same
--      row this app fetches right after sign-in (see app/_layout.tsx's
--      fetchMyProfile), not a second query or a join against a
--      separate log table just to answer "is this account restricted."
--   2. account_moderation_actions — a real audit trail, one row per
--      action taken, kept separate from the mutable status columns
--      above for the same reason profile_update_request_events is kept
--      separate from profile_update_requests' own status: the
--      denormalized columns can only ever show current state, not "who
--      did this, when, and why" over time.

-- ----------------------------------------------------------------------
-- Denormalized status columns
-- ----------------------------------------------------------------------

alter table public.profiles
  add column is_banned boolean not null default false,
  add column is_suspended boolean not null default false,
  add column suspended_until timestamptz,
  add column moderation_reason text,
  add constraint profiles_not_banned_and_suspended check (not (is_banned and is_suspended));

alter table public.facilities
  add column is_banned boolean not null default false,
  add column is_suspended boolean not null default false,
  add column suspended_until timestamptz,
  add column moderation_reason text,
  add constraint facilities_not_banned_and_suspended check (not (is_banned and is_suspended));

alter table public.organizations
  add column is_banned boolean not null default false,
  add column is_suspended boolean not null default false,
  add column suspended_until timestamptz,
  add column moderation_reason text,
  add constraint organizations_not_banned_and_suspended check (not (is_banned and is_suspended));

-- ----------------------------------------------------------------------
-- Audit trail
-- ----------------------------------------------------------------------

create type moderation_action_type as enum (
  'banned',
  'unbanned',
  'suspended',
  'unsuspended',
  -- Distinct from 'unsuspended' deliberately — this one is system-
  -- generated (the cron job below), not an admin manually lifting a
  -- suspension early. The audit trail should be able to tell those two
  -- apart, not collapse them into the same event.
  'suspension_expired'
);

create table public.account_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  entity_type profile_update_entity_type not null,
  entity_id uuid not null,
  action_type moderation_action_type not null,
  reason text,
  -- Only meaningful for 'suspended' rows — when that suspension is due
  -- to lift. Kept on the audit row itself (not just derived from
  -- created_at + a duration) so the historical record is self-
  -- contained even if the entity's own suspended_until later changes.
  expires_at timestamptz,
  -- Null for 'suspension_expired' — there's no admin to attribute a
  -- system-generated event to.
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index account_moderation_actions_entity_idx
  on public.account_moderation_actions (entity_type, entity_id, created_at desc);

alter table public.account_moderation_actions enable row level security;

create policy "admins and the affected entity's owner see moderation history"
  on public.account_moderation_actions for select
  to authenticated
  using (public.is_admin() or public.can_request_profile_update(entity_type, entity_id));

create policy "admins log moderation actions"
  on public.account_moderation_actions for insert
  to authenticated
  with check (public.is_admin() and performed_by = auth.uid());

-- ----------------------------------------------------------------------
-- Auto-clear expired suspensions
-- ----------------------------------------------------------------------
-- Login/access checks should always independently verify
-- suspended_until > now() rather than trust is_suspended alone (a cron
-- job runs on a schedule, not instantly — there's necessarily a window
-- right at expiry where is_suspended could still read true). This job
-- exists for housekeeping/UI accuracy — so an admin screen doesn't keep
-- showing "Suspended" forever after it's actually lifted — not as the
-- sole source of truth for whether access should currently be blocked.

create or replace function public.clear_expired_suspensions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expired record;
begin
  for expired in
    select 'user'::profile_update_entity_type as entity_type, id as entity_id
    from public.profiles
    where is_suspended and suspended_until is not null and suspended_until <= now()
    union all
    select 'facility'::profile_update_entity_type, id
    from public.facilities
    where is_suspended and suspended_until is not null and suspended_until <= now()
    union all
    select 'organization'::profile_update_entity_type, id
    from public.organizations
    where is_suspended and suspended_until is not null and suspended_until <= now()
  loop
    if expired.entity_type = 'user' then
      update public.profiles
      set is_suspended = false, suspended_until = null, moderation_reason = null
      where id = expired.entity_id;
    elsif expired.entity_type = 'facility' then
      update public.facilities
      set is_suspended = false, suspended_until = null, moderation_reason = null
      where id = expired.entity_id;
    else
      update public.organizations
      set is_suspended = false, suspended_until = null, moderation_reason = null
      where id = expired.entity_id;
    end if;

    insert into public.account_moderation_actions (entity_type, entity_id, action_type)
    values (expired.entity_type, expired.entity_id, 'suspension_expired');
  end loop;
end;
$$;

-- Hourly, not daily like notification cleanup — a suspension that's
-- meant to lift "in 24 hours" showing as still-active for up to a full
-- extra day would be a real, noticeable correctness gap for this
-- feature specifically, unlike notification retention where a day of
-- slack is inconsequential.
--
-- if not exists here too, defensively — pg_cron should already be
-- enabled by 20260907000000_notification_retention_cleanup.sql, but
-- this makes the current migration self-sufficient regardless of
-- whether that one has actually run first.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('clear-expired-suspensions');
exception
  when others then
    null; -- job didn't exist yet — fine, proceed to create it below
end $$;

select cron.schedule(
  'clear-expired-suspensions',
  '0 * * * *',
  $$select public.clear_expired_suspensions();$$
);
