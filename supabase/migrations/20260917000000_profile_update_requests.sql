-- ============================================================================
-- Profile update requests — request/review/merge flow for locked,
-- post-verification fields.
-- ============================================================================
-- Same shape as formulary_requests (features/catalog): pending ->
-- approved/rejected -> merged, a distinct merge step separate from the
-- approve decision itself, so an admin reviewing supporting documents
-- isn't forced to also be the one applying field values in the same
-- action. Unlike formulary_requests (which creates something new),
-- this always targets an EXISTING row — merging means applying the
-- requested field changes onto that row, not creating a new one.
--
-- entity_type/entity_id is a deliberate polymorphic reference (no FK)
-- covering profiles/facilities/organizations from one table, since the
-- request/review/audit shape is identical across all three — the only
-- real difference between them is which fields are eligible, which is
-- enforced at the application layer (see profile-update-fields.ts).

create type profile_update_entity_type as enum ('user', 'facility', 'organization');
create type profile_update_request_status as enum ('pending', 'approved', 'rejected', 'merged');

create table public.profile_update_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type profile_update_entity_type not null,
  entity_id uuid not null,
  requested_by uuid not null references public.profiles(id),
  -- { fieldName: newValue } — only the fields actually being changed,
  -- not a full snapshot of the entity.
  changes jsonb not null,
  -- { fieldName: oldValue }, captured at submission time so the
  -- reviewer (and the audit trail) can see a real diff without having
  -- to separately reconstruct "what did this look like before" from a
  -- row that may have changed again since.
  previous_values jsonb not null,
  -- [{ name, uri }] — submitted once at request time, not incrementally
  -- managed like kyc_documents; a plain jsonb array is proportionate
  -- here rather than a whole second table.
  supporting_documents jsonb not null default '[]',
  status profile_update_request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  merged_at timestamptz,
  created_at timestamptz not null default now()
);

-- The audit trail — every state transition recorded as its own row,
-- separate from profile_update_requests' current-state columns above.
-- The request row alone can't show a full history (e.g. it has no way
-- to represent "approved, but merge is still pending" as distinct
-- events with their own timestamps/actors), and a dedicated table is
-- what "should have an audit trail" actually calls for rather than
-- just trusting the mutable status columns.
create table public.profile_update_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.profile_update_requests(id) on delete cascade,
  event_type text not null check (event_type in ('submitted', 'approved', 'rejected', 'merged')),
  actor_id uuid not null references public.profiles(id),
  comment text,
  created_at timestamptz not null default now()
);

-- Same reasoning as is_facility_owner (initial_schema.sql) and the org
-- admin_user_id check already used in that table's own RLS — this just
-- extends the same "who's allowed to act as this entity's owner" logic
-- across all three entity types into one reusable check, since every
-- insert into this table needs it regardless of which entity type is
-- involved.
create or replace function public.can_request_profile_update(p_entity_type profile_update_entity_type, p_entity_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case p_entity_type
    when 'user' then p_entity_id = auth.uid()
    when 'facility' then public.is_facility_owner(p_entity_id)
    when 'organization' then exists (
      select 1 from public.organizations where id = p_entity_id and admin_user_id = auth.uid()
    )
    else false
  end;
$$;

alter table public.profile_update_requests enable row level security;
alter table public.profile_update_request_events enable row level security;

create policy "owners and admins see relevant update requests"
  on public.profile_update_requests for select
  to authenticated
  using (requested_by = auth.uid() or public.is_admin());

create policy "owners submit their own update requests"
  on public.profile_update_requests for insert
  to authenticated
  with check (requested_by = auth.uid() and public.can_request_profile_update(entity_type, entity_id));

create policy "admins decide on update requests"
  on public.profile_update_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "owners and admins see relevant audit events"
  on public.profile_update_request_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profile_update_requests r
      where r.id = request_id and (r.requested_by = auth.uid() or public.is_admin())
    )
  );

-- Both the requester (their own 'submitted' event) and an admin
-- (approved/rejected/merged) insert events directly — same pattern as
-- how this app already lets clients insert their own activity rows
-- elsewhere (e.g. donation_responses) rather than routing everything
-- through a server-side function for a simple, append-only log.
create policy "requester logs their own submission"
  on public.profile_update_request_events for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and event_type = 'submitted'
    and exists (
      select 1 from public.profile_update_requests r
      where r.id = request_id and r.requested_by = auth.uid()
    )
  );

create policy "admins log their own review decisions"
  on public.profile_update_request_events for insert
  to authenticated
  with check (actor_id = auth.uid() and public.is_admin() and event_type in ('approved', 'rejected', 'merged'));

-- ============================================================================
-- organizations: add region/address, matching facilities' existing
-- columns — needed so "Headquarters Location" can be split the same
-- way facilities.location/address already are (see the accompanying
-- location-vs-address terminology note in the app's profile forms):
-- location/headquarters_location holds the Ghana Post GPS digital
-- address code, address is the human-readable text that actually
-- appears on cards. latitude/longitude ("current location") already
-- exist on both tables from the GPS capture migration and are
-- unaffected by this split.
--
-- if not exists on both columns: region already exists on the live
-- organizations table (added outside this migration's own history),
-- so a plain add column fails the whole migration outright rather
-- than just skipping the column that's already there.
-- ============================================================================

alter table public.organizations
  add column if not exists region text,
  add column if not exists address text;