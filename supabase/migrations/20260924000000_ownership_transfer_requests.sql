-- ============================================================================
-- Facility/organization ownership transfer requests.
-- ============================================================================
-- Any KYC-verified user can request to become the owner of a facility
-- or organization they don't already own, with supporting evidence; an
-- admin reviews and either approves (which immediately grants
-- ownership and demotes whoever held it before) or rejects, with a
-- required comment either way.
--
-- Same shape as profile_update_requests deliberately — entity_type/
-- entity_id polymorphic reference, jsonb supporting_documents, a
-- separate _events audit table — but this table only ever covers
-- 'facility' and 'organization', never 'user' (a person can't be
-- "owned"). Reusing profile_update_entity_type rather than defining a
-- narrower, parallel enum keeps this consistent with the rest of the
-- app's entity-type handling; the check constraint below is what
-- actually enforces the narrower set at the DB level.

create type ownership_transfer_status as enum ('pending', 'approved', 'rejected');

create table public.ownership_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type profile_update_entity_type not null check (entity_type in ('facility', 'organization')),
  entity_id uuid not null,
  requested_by uuid not null references public.profiles(id),
  reason text not null,
  -- [{ name, uri }] — same shape and same reasoning as
  -- profile_update_requests.supporting_documents: submitted once at
  -- request time, proportionate as a plain jsonb array rather than a
  -- second table.
  supporting_documents jsonb not null default '[]',
  status ownership_transfer_status not null default 'pending',
  -- Required on both approval and rejection, not just rejection — an
  -- approval that immediately reassigns account ownership deserves the
  -- same on-record justification a rejection does.
  admin_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ownership_transfer_requests_entity_idx
  on public.ownership_transfer_requests (entity_type, entity_id);

create table public.ownership_transfer_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.ownership_transfer_requests(id) on delete cascade,
  event_type text not null check (event_type in ('submitted', 'approved', 'rejected')),
  actor_id uuid not null references public.profiles(id),
  comment text,
  created_at timestamptz not null default now()
);

-- Mirrors can_request_profile_update's ownership checks, inverted —
-- this gates who may REQUEST ownership (not already the owner), not
-- who already has it. A facility's "owner" for this purpose is
-- is_facility_owner (facility_memberships.role = 'Owner'), the same
-- function every other ownership-gated feature in this app already
-- treats as authoritative — not facilities.admin_user_id, which this
-- flow keeps in sync but is not the operative permission check.
create or replace function public.can_request_ownership_transfer(p_entity_type profile_update_entity_type, p_entity_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (select 1 from public.profiles where id = auth.uid() and kyc_status = 'verified')
    and case p_entity_type
      when 'facility' then not public.is_facility_owner(p_entity_id)
      when 'organization' then not exists (
        select 1 from public.organizations where id = p_entity_id and admin_user_id = auth.uid()
      )
      else false
    end;
$$;

alter table public.ownership_transfer_requests enable row level security;
alter table public.ownership_transfer_events enable row level security;

create policy "requesters and admins see relevant ownership requests"
  on public.ownership_transfer_requests for select
  to authenticated
  using (requested_by = auth.uid() or public.is_admin());

create policy "verified non-owners submit ownership requests"
  on public.ownership_transfer_requests for insert
  to authenticated
  with check (requested_by = auth.uid() and public.can_request_ownership_transfer(entity_type, entity_id));

create policy "admins decide on ownership requests"
  on public.ownership_transfer_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "requesters and admins see relevant ownership audit events"
  on public.ownership_transfer_events for select
  to authenticated
  using (
    exists (
      select 1 from public.ownership_transfer_requests r
      where r.id = request_id and (r.requested_by = auth.uid() or public.is_admin())
    )
  );

create policy "requester logs their own ownership submission"
  on public.ownership_transfer_events for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and event_type = 'submitted'
    and exists (
      select 1 from public.ownership_transfer_requests r
      where r.id = request_id and r.requested_by = auth.uid()
    )
  );

create policy "admins log their own ownership review decisions"
  on public.ownership_transfer_events for insert
  to authenticated
  with check (actor_id = auth.uid() and public.is_admin() and event_type in ('approved', 'rejected'));

-- ----------------------------------------------------------------------
-- Supporting document storage
-- ----------------------------------------------------------------------
-- Unlike profile-update-documents (kyc-documents-style {entity_type}/
-- {entity_id}/{filename} paths, checked by "is this the entity's
-- current owner or an admin"), that check is WRONG here by
-- construction: the whole point of this flow is that the uploader is
-- NOT yet the entity's owner. Paths are scoped by request id instead —
-- {request_id}/{filename} — checked by "is this the request's own
-- requester, or an admin."

insert into storage.buckets (id, name, public)
values ('ownership-transfer-documents', 'ownership-transfer-documents', false)
on conflict (id) do nothing;

create or replace function public.can_access_ownership_transfer_document(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  path_request_id uuid;
begin
  path_request_id := nullif(split_part(object_name, '/', 1), '')::uuid;
  if path_request_id is null then
    return false;
  end if;

  return
    public.is_admin()
    or exists (
      select 1 from public.ownership_transfer_requests
      where id = path_request_id and requested_by = auth.uid()
    );
exception
  when invalid_text_representation then
    return false;
end;
$$;

create policy "ownership transfer documents readable by requester or admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ownership-transfer-documents' and public.can_access_ownership_transfer_document(name));

create policy "ownership transfer documents uploaded by requester or admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ownership-transfer-documents' and public.can_access_ownership_transfer_document(name));

create policy "ownership transfer documents deleted by requester or admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ownership-transfer-documents' and public.can_access_ownership_transfer_document(name));

-- ----------------------------------------------------------------------
-- Notification categories
-- ----------------------------------------------------------------------
-- notification_category is an actual Postgres enum (see notifications
-- table, initial_schema.sql), not plain text — these values have to
-- exist here too, not just in the TypeScript NotificationCategory type,
-- or an insert using either one fails outright. if not exists since
-- Postgres errors on re-adding a value that's already there, and
-- migrations should be safe to reason about being re-applied.
alter type notification_category add value if not exists 'ownership_transfer_decision';
alter type notification_category add value if not exists 'ownership_transferred';

