-- ============================================================================
-- Organization memberships — a real membership table, mirroring
-- facility_memberships exactly.
-- ============================================================================
-- Until now the only user<->organization relationship was the single
-- organizations.admin_user_id column, which is what
-- is_organization_member() (added in the organization group chat
-- migration) had to fall back to. This table gives organizations the
-- same real membership concept facilities already have, and
-- is_organization_member() below is updated to check it — the one
-- change that migration promised would be enough to extend chat
-- access beyond "just the admin".
--
-- is_organization_admin() (pre-existing, checks admin_user_id
-- directly) is left untouched — it's already relied on by
-- facility_organization_requests' RLS and elsewhere, and redefining it
-- to read from this new table instead would risk those call sites in
-- ways not worth the risk here. The two functions now play the same
-- roles is_facility_owner()/is_facility_member() already play for
-- facilities: one checks a specific role, the other checks membership
-- at all.

create type organization_member_role as enum ('Admin', 'Member');

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role organization_member_role not null default 'Member',
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_memberships enable row level security;

-- Same "Pattern D" as facility_memberships — visible to other members
-- of the same organization, not the whole app.
create policy "members see their organization's membership list"
  on public.organization_memberships for select
  to authenticated
  using (public.is_organization_member(organization_id) or public.is_admin());

create policy "organization admin manages membership"
  on public.organization_memberships for all
  to authenticated
  using (public.is_organization_admin(organization_id) or public.is_admin())
  with check (public.is_organization_admin(organization_id) or public.is_admin());

create index idx_organization_memberships_user_id on public.organization_memberships(user_id);

-- Backfill: every existing organization's current admin becomes an
-- 'Admin' row here. Without this, every existing organization's admin
-- would lose chat access the moment is_organization_member() below
-- starts reading this table instead of admin_user_id directly.
insert into public.organization_memberships (organization_id, user_id, role)
select id, admin_user_id, 'Admin' from public.organizations
on conflict (organization_id, user_id) do nothing;

-- Keeps this table in sync with organizations.admin_user_id going
-- forward — both at creation and whenever ownership transfers (see
-- features/ownership-transfer, which updates admin_user_id directly
-- for organizations with no equivalent of the demote/promote dance it
-- already does for facility_memberships). A trigger here means that
-- stays correct regardless of which client code path changes
-- admin_user_id, rather than depending on every such path remembering
-- to update this table too.
create or replace function public.sync_organization_admin_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- old is unassigned on INSERT (not null) — it's only ever read
  -- inside this nested block, which only runs once tg_op = 'UPDATE' is
  -- already known true, so there's no reliance on and's short-circuit
  -- evaluation for correctness. Same reasoning as handle_rating_change.
  if tg_op = 'UPDATE' then
    if old.admin_user_id = new.admin_user_id then
      return new;
    end if;

    update public.organization_memberships
      set role = 'Member'
      where organization_id = new.id and user_id = old.admin_user_id and role = 'Admin';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
    values (new.id, new.admin_user_id, 'Admin')
    on conflict (organization_id, user_id) do update set role = 'Admin';

  return new;
end;
$$;

create trigger organization_admin_membership_sync
  after insert or update of admin_user_id on public.organizations
  for each row execute function public.sync_organization_admin_membership();

-- The actual, promised change: is_organization_member() now checks
-- real membership instead of only ever matching the single admin.
create or replace function public.is_organization_member(check_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = check_organization_id and user_id = auth.uid()
  );
$$;

-- ============================================================================
-- Organization membership requests — mirrors facility_membership_requests
-- exactly, including the one-pending-at-a-time constraint.
-- ============================================================================
create table public.organization_membership_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  status request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index organization_membership_requests_one_pending
  on public.organization_membership_requests (organization_id, requested_by)
  where (status = 'pending');

alter table public.organization_membership_requests enable row level security;

create policy "requester, org admin, and admin see membership requests"
  on public.organization_membership_requests for select
  to authenticated
  using (
    requested_by = auth.uid()
    or public.is_organization_admin(organization_id)
    or public.is_admin()
  );

create policy "users request to join a verified organization"
  on public.organization_membership_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and exists (select 1 from public.organizations o where o.id = organization_id and o.kyc_status = 'verified')
  );

create policy "organization admin or platform admin decides membership requests"
  on public.organization_membership_requests for update
  to authenticated
  using (public.is_organization_admin(organization_id) or public.is_admin())
  with check (public.is_organization_admin(organization_id) or public.is_admin());
