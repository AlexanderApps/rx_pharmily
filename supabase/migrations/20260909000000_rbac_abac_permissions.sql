-- ============================================================================
-- RBAC + ABAC: permission catalog, role defaults, per-user overrides.
-- ============================================================================
-- Two layers, deliberately separate tables rather than one combined
-- concept:
--
--   RBAC (role_permissions) — "what does a verified pharmacist get by
--   default". Coarse, role-based, the normal case for almost everyone.
--
--   ABAC (user_permission_overrides) — "this ONE person is an exception
--   to their role's default, for this ONE permission". Rare, explicit,
--   always wins over the role default when both exist for the same
--   user + permission.
--
-- The "role" here is deliberately NOT the same thing as either existing
-- role concept in this app:
--   - accountRole ('user'/'admin'/'superadmin') is about platform
--     administration, unrelated to professional verification.
--   - profiles.role ('Pharmacist'/'Pharmacy Technician'/etc.) is a
--     professional title, currently just a display label with no
--     access-control meaning at all.
-- This system derives its own 4-tier base role from a combination of
-- both, via get_user_base_role() below — 'public' (any signed-in user,
-- not yet KYC-verified), 'verified' (kyc_status = 'verified',
-- regardless of which professional title), 'admin', 'superadmin'.
-- Per-professional-title granularity (e.g. "procurement officers can't
-- post donations but pharmacists can") isn't built into the initial
-- seed data below, but the architecture supports it without a schema
-- change — role_permissions accepts any role string, so a future
-- 'verified_procurement_officer' row would just be additional data, not
-- a redesign.

create table public.permissions (
  key text primary key,
  description text not null,
  category text not null
);

create table public.role_permissions (
  role text not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  granted boolean not null default true,
  primary key (role, permission_key)
);

create table public.user_permission_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  granted boolean not null,
  -- Free-text context for why this specific exception exists — this
  -- table is meant to stay small and rare; a reason field makes it
  -- auditable rather than a set of unexplained rows six months later.
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

create index idx_user_permission_overrides_user on public.user_permission_overrides(user_id);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permission_overrides enable row level security;

-- The catalog and role defaults aren't sensitive — knowing that a
-- "verified" role includes "rxrfq.create" isn't privileged information,
-- and the client needs to read role_permissions to compute permissions
-- client-side anyway (see use-permissions.ts). Only admins manage them.
create policy "any authenticated user reads the permission catalog"
  on public.permissions for select
  to authenticated
  using (true);

create policy "admins manage the permission catalog"
  on public.permissions for insert
  to authenticated
  with check (public.is_admin());
create policy "admins update the permission catalog"
  on public.permissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "admins delete from the permission catalog"
  on public.permissions for delete
  to authenticated
  using (public.is_admin());

create policy "any authenticated user reads role defaults"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "admins manage role defaults"
  on public.role_permissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Overrides ARE more sensitive than the catalog/role-defaults above —
-- this says something specific about one named person (e.g. "this
-- account was explicitly denied rxrfq.create", which could be read as
-- implying why). A user can see their own effective overrides (so
-- their own account settings/support screens can explain "you have a
-- custom permission" honestly), but not anyone else's; only admins
-- manage them.
create policy "users see their own permission overrides"
  on public.user_permission_overrides for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "admins manage permission overrides"
  on public.user_permission_overrides for insert
  to authenticated
  with check (public.is_admin());
create policy "admins update permission overrides"
  on public.user_permission_overrides for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "admins delete permission overrides"
  on public.user_permission_overrides for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------
-- get_user_base_role(user_id) — the RBAC tier a user falls into today.
-- ----------------------------------------------------------------------
create or replace function public.get_user_base_role(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.account_role = 'superadmin' then 'superadmin'
    when p.account_role = 'admin' then 'admin'
    when p.kyc_status = 'verified' then 'verified'
    else 'public'
  end
  from public.profiles p
  where p.id = p_user_id;
$$;

-- ----------------------------------------------------------------------
-- get_user_permissions(user_id) — the full, resolved permission set:
-- every catalog key, with the override (if one exists for this user)
-- taking precedence over the role default, and false as the final
-- fallback if neither says anything about a given key at all.
--
-- Guarded to auth.uid() (or an admin checking anyone's, for an admin
-- management UI) — without this, security definer here would let any
-- signed-in user call this for an arbitrary p_user_id and learn whether
-- that specific person has a custom override, which is exactly the
-- kind of per-person information user_permission_overrides' own RLS
-- policy above already treats as sensitive.
-- ----------------------------------------------------------------------
create or replace function public.get_user_permissions(p_user_id uuid)
returns table(permission_key text, granted boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'not authorized to view this user''s permissions';
  end if;

  return query
  select
    perm.key as permission_key,
    coalesce(
      (select o.granted from public.user_permission_overrides o
        where o.user_id = p_user_id and o.permission_key = perm.key),
      (select rp.granted from public.role_permissions rp
        where rp.role = public.get_user_base_role(p_user_id) and rp.permission_key = perm.key),
      false
    ) as granted
  from public.permissions perm;
end;
$$;

-- ----------------------------------------------------------------------
-- Seed the initial permission catalog and role defaults.
-- ----------------------------------------------------------------------
-- Public tier (RxVital/vitals, RxHelp/help, RxLink) — any signed-in
-- user, no KYC verification required. Everything else (RxRFQ,
-- donations, MediScope, jobs, ads) requires 'verified'.

insert into public.permissions (key, description, category) values
  ('vitals.view', 'View vitals tracking', 'RxVital'),
  ('vitals.create', 'Log a vitals reading', 'RxVital'),
  ('help.view', 'View RxHelp consult/question threads', 'RxHelp'),
  ('help.consult_request', 'Submit a facility setup consult request', 'RxHelp'),
  ('help.ask_pharmacist', 'Ask a pharmacist a medication question', 'RxHelp'),
  ('rxlink.view', 'View RxLink requests', 'RxFind'),
  ('rxlink.submit', 'Submit a new RxLink medication search request', 'RxFind'),
  ('rxrfq.view', 'View RxRFQ marketplace listings', 'RxRFQ'),
  ('rxrfq.create', 'Create a new RxRFQ request', 'RxRFQ'),
  ('rxrfq.respond', 'Respond to an RxRFQ as a vendor', 'RxRFQ'),
  ('donations.view', 'View donation marketplace listings', 'Donations'),
  ('donations.create', 'Post a new donation', 'Donations'),
  ('donations.claim', 'Claim items from a donation', 'Donations'),
  ('mediscope.view', 'View MediScope marketplace listings', 'MediScope'),
  ('mediscope.create', 'Create a new MediScope request', 'MediScope'),
  ('mediscope.respond', 'Respond to a MediScope request as a vendor', 'MediScope'),
  ('jobs.view', 'View job listings', 'Jobs'),
  ('jobs.post', 'Post a new job listing', 'Jobs'),
  ('jobs.apply', 'Apply to a job listing', 'Jobs'),
  ('ads.view', 'View ad listings', 'Ads'),
  ('ads.create', 'Create a new ad', 'Ads')
on conflict (key) do nothing;

-- Every tier from 'public' up gets the RxVital/RxHelp/RxFind set —
-- these are the features meant for any signed-in user regardless of
-- verification, so 'public' itself and everything above it all include
-- them (a verified pharmacist isn't LOSING access to the public
-- features by also being verified).
insert into public.role_permissions (role, permission_key, granted)
select role, key, true
from unnest(array['public', 'verified', 'admin', 'superadmin']) as role
cross join public.permissions
where category in ('RxVital', 'RxHelp', 'RxFind')
on conflict (role, permission_key) do nothing;

-- 'verified' and up additionally get the core marketplace features —
-- these require KYC verification, which 'public' by definition doesn't
-- have yet.
insert into public.role_permissions (role, permission_key, granted)
select role, key, true
from unnest(array['verified', 'admin', 'superadmin']) as role
cross join public.permissions
where category in ('RxRFQ', 'Donations', 'MediScope', 'Jobs', 'Ads')
on conflict (role, permission_key) do nothing;
