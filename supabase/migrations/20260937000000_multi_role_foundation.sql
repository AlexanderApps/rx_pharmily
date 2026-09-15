-- ============================================================================
-- Foundational roles/permissions redesign: multi-role, union-based.
-- ============================================================================
-- Replaces the single-tier model (one role per user, computed by
-- get_user_base_role()'s six-way case statement) with an explicit,
-- stored, multi-valued profiles.roles — every user always carries
-- 'public'; account_role and profession can each additionally grant a
-- role, but nothing stops a person from holding several unrelated
-- roles at once (a pharmacist who's also an auditor, an internal
-- admin who's also public-only for their own personal account, etc).
--
-- What determines a person's access is now the UNION of every
-- permission (and feature) granted to ANY role they hold — pure
-- union, no capping mechanism. A restrictive role (auditor) only
-- actually restricts someone who holds ONLY that role; combined with
-- any role that grants write access, the write access wins. This is
-- deliberate, confirmed behavior, not an oversight.
--
-- FEATURE vs PERMISSION: a "feature" is what nav/UI decides to show at
-- all (RxRFQ, MediScope, RxChat, ...) — it's the same set of strings
-- already used as permissions.category. A "permission" is the finer-
-- grained action within a feature a role can or can't take (.view vs
-- .create vs .respond). A role can hold a feature with only view-level
-- permissions inside it (this is exactly what the PSS tier already
-- was, and remains, under the new names below).
--
-- WHAT'S DELIBERATELY OUT OF SCOPE THIS PASS: reworking
-- role-permissions.tsx and permission-overrides.tsx to actually edit
-- role_features or a multi-role user, and dropping is_pharmacist/
-- is_pss. Those are real, separate pieces of work — this migration
-- keeps both existing admin screens working exactly as before via the
-- get_user_base_role() shim at the bottom, rather than leaving them
-- broken until that follow-up work happens.

-- ----------------------------------------------------------------------
-- Roles catalog — single source of truth for "what roles exist" at
-- all, so nothing has to hardcode a tier list the way
-- role-permissions.tsx's TIER_META currently does. role_permissions/
-- role_features below both FK to this; profiles.roles can't (Postgres
-- has no FK-into-array-element), so its own values are only as
-- trustworthy as whatever writes to it — currently just this
-- migration's backfill, the account_role sync trigger below, and the
-- one-time KYC-approval seeding that'll be added to setUserProfession
-- client-side (deliberately NOT a DB trigger — see that function's own
-- comment once updated for why this one isn't meant to stay in sync).
-- ----------------------------------------------------------------------
create table public.roles (
  key text primary key,
  label text not null,
  description text not null
);

alter table public.roles enable row level security;

create policy "roles readable by authenticated users"
  on public.roles for select to authenticated using (true);

create policy "superadmins manage the roles catalog"
  on public.roles for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

insert into public.roles (key, label, description) values
  ('public', 'Public', 'Every signed-in user, automatically — the base features everyone gets regardless of anything else.'),
  ('pharmacist', 'Pharmacist', 'Verified pharmacists — full marketplace access.'),
  ('pss', 'Pharmacy Support Staff', 'Verified technicians and MCAs — read-only marketplace access, full chat and formulary requests.'),
  ('auditor', 'Auditor', 'Read-only visibility into every feature, for oversight — granted independently of KYC/profession.'),
  ('admin', 'Admin', 'Platform administration.'),
  ('superadmin', 'Superadmin', 'Full platform administration, including managing roles and their defaults.');

-- ----------------------------------------------------------------------
-- profiles.roles — the actual, stored, multi-valued role assignment.
-- ----------------------------------------------------------------------
alter table public.profiles add column roles text[] not null default array['public'];

-- Backfill from today's actual state, so nobody's access changes the
-- moment this migration runs — a currently-admin user keeps admin
-- access, a currently-verified pharmacist keeps pharmacist access, a
-- currently-public user stays public-only.
update public.profiles set roles = (
  select array_agg(distinct r) from unnest(
    array['public']
    || case when account_role = 'admin' then array['admin'] else array[]::text[] end
    || case when account_role = 'superadmin' then array['superadmin'] else array[]::text[] end
    || case when kyc_status = 'verified' and profession = 'Pharmacist' then array['pharmacist'] else array[]::text[] end
    || case when kyc_status = 'verified' and profession in ('Technician', 'MCA') then array['pss'] else array[]::text[] end
  ) as r
);

-- ----------------------------------------------------------------------
-- Keep account_role and roles' admin/superadmin entries in sync going
-- forward — unlike profession (a one-time seed, deliberately allowed
-- to drift from roles afterward), account_role is the actual thing
-- is_admin()/is_superadmin() check everywhere in this app's RLS, so
-- letting it silently diverge from roles would be a real, exploitable
-- inconsistency, not just a display staleness. This is the one role
-- assignment that stays a real, ongoing sync.
-- ----------------------------------------------------------------------
create or replace function public.sync_account_role_into_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.roles := array_remove(array_remove(new.roles, 'admin'), 'superadmin');
  if new.account_role = 'admin' then
    new.roles := new.roles || array['admin'];
  elsif new.account_role = 'superadmin' then
    new.roles := new.roles || array['superadmin'];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_account_role_into_roles on public.profiles;
create trigger trg_sync_account_role_into_roles
  before insert or update of account_role on public.profiles
  for each row execute function public.sync_account_role_into_roles();

-- ----------------------------------------------------------------------
-- role_features — same shape and same RLS as role_permissions
-- (superadmin-only writes, authenticated reads), for the coarser
-- "which nav items/screens does this role see at all" question.
-- ----------------------------------------------------------------------
create table public.role_features (
  role text not null references public.roles(key) on delete cascade,
  feature text not null,
  granted boolean not null default true,
  primary key (role, feature)
);

alter table public.role_features enable row level security;

create policy "role features readable by authenticated users"
  on public.role_features for select to authenticated using (true);

create policy "superadmins manage role features"
  on public.role_features for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ----------------------------------------------------------------------
-- Migrate existing role_permissions rows onto the new role names —
-- preserves every grant already carefully built up this session
-- (verified_pss's read-only marketplace + full chat + formulary, etc)
-- rather than re-specifying them from scratch under new names.
-- verified_unclassified is dropped outright, not renamed: under the
-- new model, someone verified with no special role is just 'public'
-- (their roles array literally only contains 'public'), so a
-- dedicated tier for that case is redundant now, not merely renamed.
-- ----------------------------------------------------------------------
update public.role_permissions set role = 'pharmacist' where role = 'verified_pharmacist';
update public.role_permissions set role = 'pss' where role = 'verified_pss';
delete from public.role_permissions where role = 'verified_unclassified';

-- Same FK-to-catalog role_features already has — added here, not in
-- role_permissions' own original migration, since the catalog didn't
-- exist yet then. Safe now: every remaining role_permissions.role
-- value (public/admin/superadmin from the original seed, pharmacist/
-- pss from the rename just above) matches a roles.key already seeded
-- above this point.
alter table public.role_permissions
  add constraint role_permissions_role_fkey foreign key (role) references public.roles(key) on delete cascade;

-- ----------------------------------------------------------------------
-- Seed role_features from role_permissions' own existing grants — a
-- role gets a feature if it was granted any permission in that
-- feature's category at all. This derives the coarse feature grants
-- from the fine-grained ones already in place, rather than hand-
-- specifying both from scratch and risking them drifting apart.
-- ----------------------------------------------------------------------
insert into public.role_features (role, feature, granted)
select distinct rp.role, p.category, true
from public.role_permissions rp
join public.permissions p on p.key = rp.permission_key
where rp.granted
on conflict (role, feature) do nothing;

-- ----------------------------------------------------------------------
-- Auditor — the example role from this session's own design
-- discussion: read-only visibility into every feature. Deliberately
-- every .view-suffixed permission across the whole catalog, not
-- feature-by-feature, so a newly-added feature's own .view permission
-- is picked up automatically by this same query in the future — this
-- is a one-time seed, though; a feature added by a LATER migration
-- still needs its own explicit auditor grant if it should be
-- auditable, same as every other role's grants are migration-managed.
-- ----------------------------------------------------------------------
insert into public.role_features (role, feature, granted)
select distinct 'auditor', category, true from public.permissions
on conflict (role, feature) do nothing;

insert into public.role_permissions (role, permission_key, granted)
select 'auditor', key, true from public.permissions where key like '%.view'
on conflict (role, permission_key) do nothing;

-- ----------------------------------------------------------------------
-- user_has_permission — reusable by RLS policies that need a single
-- permission check without a whole resolved map, e.g. formulary_requests'
-- insert policy below. Same override -> role-union -> false resolution
-- as get_user_permissions, just scoped to one key instead of every key
-- in the catalog, and returning a boolean instead of a table.
-- ----------------------------------------------------------------------
create or replace function public.user_has_permission(p_user_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select o.granted from public.user_permission_overrides o
      where o.user_id = p_user_id and o.permission_key = p_key),
    (select bool_or(rp.granted) from public.role_permissions rp
      join public.profiles pr on pr.id = p_user_id
      where rp.role = any(pr.roles) and rp.permission_key = p_key),
    false
  );
$$;

-- ----------------------------------------------------------------------
-- get_user_permissions — same public signature/return shape as
-- before (every catalog key + resolved boolean), so every existing
-- client-side hasPermission("x") consumer keeps working completely
-- unchanged; only the internal resolution moved from "one tier" to
-- "union across every held role".
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
    public.user_has_permission(p_user_id, perm.key) as granted
  from public.permissions perm;
end;
$$;

-- ----------------------------------------------------------------------
-- get_user_features — same union-across-roles shape as
-- get_user_permissions, for the coarser "which features does this
-- person see at all" question the nav/UI actually needs.
-- ----------------------------------------------------------------------
create or replace function public.get_user_features(p_user_id uuid)
returns table(feature text, granted boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_roles text[];
begin
  if p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'not authorized to view this user''s features';
  end if;

  select p.roles into v_roles from public.profiles p where p.id = p_user_id;

  return query
  select
    f.feature,
    coalesce(bool_or(rf.granted), false) as granted
  from (select distinct role_features.feature from public.role_features) f
  left join public.role_features rf
    on rf.feature = f.feature
    and rf.role = any(v_roles)
  group by f.feature;
end;
$$;

-- ----------------------------------------------------------------------
-- formulary_requests' insert policy previously hardcoded the old tier
-- names directly — rewritten onto the new, reusable
-- user_has_permission() helper so it (and any future policy like it)
-- reads from the same role-union resolution everything else now uses,
-- rather than each policy re-deriving its own tier list by hand.
-- ----------------------------------------------------------------------
drop policy if exists "verified pss/pharmacist submit formulary requests" on public.formulary_requests;
create policy "users with formulary.request submit formulary requests"
  on public.formulary_requests for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_has_permission(auth.uid(), 'formulary.request')
  );

-- ----------------------------------------------------------------------
-- get_user_base_role — DEPRECATED, display-only compatibility shim.
-- ----------------------------------------------------------------------
-- Nothing above calls this anymore — get_user_permissions/
-- get_user_features resolve from the full roles[] union, not a single
-- tier. Kept only so app/admin/role-permissions.tsx and
-- app/admin/permission-overrides.tsx (both still built around "one
-- role per user") don't break before their own rework lands: this
-- returns the single highest-priority role a person holds, for
-- display purposes, and is NOT a complete picture of their actual
-- access under the new model — someone holding both 'pharmacist' and
-- 'auditor' shows here as just 'pharmacist'.
create or replace function public.get_user_base_role(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when 'superadmin' = any(p.roles) then 'superadmin'
    when 'admin' = any(p.roles) then 'admin'
    when 'pharmacist' = any(p.roles) then 'pharmacist'
    when 'pss' = any(p.roles) then 'pss'
    else 'public'
  end
  from public.profiles p
  where p.id = p_user_id;
$$;
