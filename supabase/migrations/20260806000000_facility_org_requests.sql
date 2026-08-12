-- ============================================================================
-- Facility & organization creation/membership request flow
-- ============================================================================
-- Previously, facilities/organizations were self-service — any user could
-- insert one directly (admin_user_id = auth.uid()), then separately submit
-- it for KYC verification. That's replaced here with a request/approval
-- flow in front of creation itself:
--
--   verified user -> creation request -> admin approves -> facility exists
--     -> existing KYC flow verifies it -> other users can request to join
--     -> admin (or the facility's own owner) approves/rejects/removes
--
-- KYC verification itself is unchanged — this adds a gate *before* it
-- (does this facility get created at all) and a gate *after* it (who's
-- allowed to join it), not a replacement for it.

create type request_status as enum ('pending', 'approved', 'rejected');

-- Facilities/organizations can no longer be inserted directly by whoever
-- would own them — only by an admin, which in practice means only through
-- the approve_*_creation_request actions below.
drop policy "facility admin can insert a facility" on public.facilities;

create policy "admins insert facilities"
  on public.facilities for insert
  to authenticated
  with check (public.is_admin());

-- organizations previously used one "for all" policy covering every
-- command for the owner — split so INSERT becomes admin-only while
-- SELECT/UPDATE/DELETE stay with the owner (they still need to edit their
-- org's details after it exists).
drop policy "org admin manages own organization" on public.organizations;

create policy "admins insert organizations"
  on public.organizations for insert
  to authenticated
  with check (public.is_admin());

create policy "org admin updates own organization"
  on public.organizations for update
  to authenticated
  using (admin_user_id = auth.uid() or public.is_admin())
  with check (admin_user_id = auth.uid() or public.is_admin());

create policy "org admin deletes own organization"
  on public.organizations for delete
  to authenticated
  using (admin_user_id = auth.uid() or public.is_admin());


create or replace function public.is_verified_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and kyc_status = 'verified'
  );
$$;


-- ============================================================================
-- FACILITY CREATION REQUESTS
-- ============================================================================

create table public.facility_creation_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id),
  name text not null,
  type facility_type not null default 'Retail Pharmacy',
  location text not null,
  region text not null,
  address text,
  phone text,
  email text,
  registration_number text,
  status request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  resulting_facility_id uuid references public.facilities(id)
);

alter table public.facility_creation_requests enable row level security;

create policy "requester and admin see facility creation requests"
  on public.facility_creation_requests for select
  to authenticated
  using (requested_by = auth.uid() or public.is_admin());

create policy "verified users request facility creation"
  on public.facility_creation_requests for insert
  to authenticated
  with check (requested_by = auth.uid() and public.is_verified_user());

create policy "admins decide facility creation requests"
  on public.facility_creation_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================================
-- ORGANIZATION CREATION REQUESTS
-- ============================================================================

create table public.organization_creation_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id),
  name text not null,
  type organization_type not null default 'Other',
  registration_number text,
  headquarters_location text,
  email text,
  phone text,
  status request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  resulting_organization_id uuid references public.organizations(id)
);

alter table public.organization_creation_requests enable row level security;

create policy "requester and admin see organization creation requests"
  on public.organization_creation_requests for select
  to authenticated
  using (requested_by = auth.uid() or public.is_admin());

create policy "verified users request organization creation"
  on public.organization_creation_requests for insert
  to authenticated
  with check (requested_by = auth.uid() and public.is_verified_user());

create policy "admins decide organization creation requests"
  on public.organization_creation_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================================
-- FACILITY MEMBERSHIP REQUESTS
-- ============================================================================
-- Unlike creation requests, the requester doesn't need to be verified
-- themselves — only the target facility does (per the requirement:
-- "once a facility is created and verified any user can request to be a
-- member"). Decisions can be made by an admin or by the facility's own
-- Owner — an additive convenience on top of admin control, not a
-- restriction of it, since a facility's own owner has an obvious, direct
-- interest in who's on their team.

create table public.facility_membership_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  status request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only one pending request per (facility, user) at a time — resubmitting
-- after a rejection is fine, but stacking duplicates while one is still
-- pending isn't useful to anyone reviewing the queue.
create unique index facility_membership_requests_one_pending
  on public.facility_membership_requests (facility_id, requested_by)
  where (status = 'pending');

alter table public.facility_membership_requests enable row level security;

create policy "requester, facility owner, and admin see membership requests"
  on public.facility_membership_requests for select
  to authenticated
  using (
    requested_by = auth.uid()
    or public.is_facility_owner(facility_id)
    or public.is_admin()
  );

create policy "users request to join a verified facility"
  on public.facility_membership_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and exists (select 1 from public.facilities f where f.id = facility_id and f.kyc_status = 'verified')
  );

create policy "facility owner or admin decides membership requests"
  on public.facility_membership_requests for update
  to authenticated
  using (public.is_facility_owner(facility_id) or public.is_admin())
  with check (public.is_facility_owner(facility_id) or public.is_admin());


-- ============================================================================
-- FACILITY -> ORGANIZATION LINK REQUESTS
-- ============================================================================
-- Same shape as membership requests: the facility's Owner requests the
-- link, and either the target organization's admin or a platform admin
-- can decide.

create table public.facility_organization_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  status request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index facility_organization_requests_one_pending
  on public.facility_organization_requests (facility_id, organization_id)
  where (status = 'pending');

alter table public.facility_organization_requests enable row level security;

create policy "facility owner, org admin, and admin see facility-org requests"
  on public.facility_organization_requests for select
  to authenticated
  using (
    public.is_facility_owner(facility_id)
    or public.is_organization_admin(organization_id)
    or public.is_admin()
  );

create policy "facility owner requests joining a verified organization"
  on public.facility_organization_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and public.is_facility_owner(facility_id)
    and exists (select 1 from public.facilities f where f.id = facility_id and f.kyc_status = 'verified')
    and exists (select 1 from public.organizations o where o.id = organization_id and o.kyc_status = 'verified')
  );

create policy "org admin or platform admin decides facility-org requests"
  on public.facility_organization_requests for update
  to authenticated
  using (public.is_organization_admin(organization_id) or public.is_admin())
  with check (public.is_organization_admin(organization_id) or public.is_admin());


-- ============================================================================
-- Notification categories for the new decision points
-- ============================================================================

alter type notification_category add value 'facility_creation_decision';
alter type notification_category add value 'organization_creation_decision';
alter type notification_category add value 'facility_membership_request_received';
alter type notification_category add value 'facility_membership_decision';
alter type notification_category add value 'facility_organization_request_received';
alter type notification_category add value 'facility_organization_decision';


-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_facility_creation_requests_status on public.facility_creation_requests(status);
create index idx_organization_creation_requests_status on public.organization_creation_requests(status);
create index idx_facility_membership_requests_facility_id on public.facility_membership_requests(facility_id);
create index idx_facility_membership_requests_status on public.facility_membership_requests(status);
create index idx_facility_organization_requests_facility_id on public.facility_organization_requests(facility_id);
create index idx_facility_organization_requests_organization_id on public.facility_organization_requests(organization_id);
create index idx_facility_organization_requests_status on public.facility_organization_requests(status);
