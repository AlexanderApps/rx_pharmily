-- ============================================================================
-- Per-profession permission tiers.
-- ============================================================================
-- Replaces the single flat 'verified' tier with three: a verified user's
-- profession now determines what they get beyond the base (RxVital/
-- RxHelp/RxFind) features, not just whether they're verified at all.
--
-- Tier resolution, confirmed this turn:
--   - profession = 'Pharmacist'            -> 'verified_pharmacist' (full access)
--   - profession in ('Technician', 'MCA')  -> 'verified_pss' (reuses the
--     existing is_pss concept — read-only marketplace access, full
--     chat, formulary requests, no ads)
--   - profession is null OR 'Other'        -> 'verified_unclassified'
--     (base features only, until an admin sets a profession — 'Other'
--     is grouped with null rather than given its own privileges,
--     matching profiles.is_pss's own existing choice to not treat
--     'Other' as a recognized professional category)
--   - account_role admin/superadmin unchanged, still checked first
--
-- This intentionally does NOT add a "facility/org membership" path to
-- these features — access is tied to the individual's own profession,
-- per this turn's confirmation, not their role within a facility.
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
    when p.kyc_status = 'verified' and p.profession = 'Pharmacist' then 'verified_pharmacist'
    when p.kyc_status = 'verified' and p.profession in ('Technician', 'MCA') then 'verified_pss'
    when p.kyc_status = 'verified' then 'verified_unclassified'
    else 'public'
  end
  from public.profiles p
  where p.id = p_user_id;
$$;

-- ----------------------------------------------------------------------
-- Tighten role_permissions writes to superadmin only. It was
-- admin-writable before this turn (same as the permission catalog
-- itself) — editing a TIER's defaults affects every user in that
-- tier, not one named person the way user_permission_overrides does,
-- so this turn's request to make the new editor screen superadmin-only
-- is matched at the RLS level too, not just hidden in the UI for a
-- regular admin who could otherwise still reach it via a direct call.
-- ----------------------------------------------------------------------
drop policy if exists "admins manage role defaults" on public.role_permissions;
create policy "superadmins manage role defaults"
  on public.role_permissions for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ----------------------------------------------------------------------
-- New permissions this tier redesign needs: formulary requests, called
-- out by name for the PSS tier this turn but never previously
-- cataloged at all.
-- ----------------------------------------------------------------------
insert into public.permissions (key, description, category) values
  ('formulary.view', 'View the formulary', 'Formulary'),
  ('formulary.request', 'Submit a formulary request', 'Formulary')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key, granted)
select role, key, true
from unnest(array['admin', 'superadmin']) as role
cross join public.permissions
where category = 'Formulary'
on conflict (role, permission_key) do nothing;

-- ----------------------------------------------------------------------
-- The flat 'verified' role no longer means anything — get_user_base_role
-- never returns it above — so its rows are genuinely dead data, not
-- just superseded. Removed rather than left around, since a future
-- admin looking at role_permissions (including via the new role-
-- defaults editor) shouldn't have to figure out that 'verified' is a
-- fossil that nothing reads anymore.
delete from public.role_permissions where role = 'verified';

-- ----------------------------------------------------------------------
-- verified_unclassified: base features only (already covered by the
-- 'public'-and-up RxVital/RxHelp/RxFind grant from the original seed —
-- 'verified_unclassified' just needs to be added to that grant's role
-- list, nothing else).
-- ----------------------------------------------------------------------
insert into public.role_permissions (role, permission_key, granted)
select 'verified_unclassified', key, true
from public.permissions
where category in ('RxVital', 'RxHelp', 'RxFind')
on conflict (role, permission_key) do nothing;

-- ----------------------------------------------------------------------
-- verified_pss (Technician/MCA): base features (below) + read-only
-- RxRFQ/Donations/MediScope/Jobs, full chat, formulary (view and
-- request), printing/exporting what they can already view, community
-- posts, profile update requests, and ownership transfer requests —
-- explicitly NOT ads, and NOT the create/respond/claim/post/apply
-- actions on the marketplace features.
-- ----------------------------------------------------------------------
insert into public.role_permissions (role, permission_key, granted)
select 'verified_pss', key, true
from public.permissions
where category in ('RxVital', 'RxHelp', 'RxFind')
on conflict (role, permission_key) do nothing;

insert into public.role_permissions (role, permission_key, granted)
select 'verified_pss', key, true
from public.permissions
where key in (
  'rxrfq.view', 'donations.view', 'mediscope.view', 'jobs.view',
  'chat.use', 'formulary.view', 'formulary.request', 'print.export',
  'posts.view', 'posts.create', 'posts.comment', 'posts.react',
  'profile.request_update', 'ownership_transfer.request'
)
on conflict (role, permission_key) do nothing;

-- ----------------------------------------------------------------------
-- verified_pharmacist: full access — base features plus everything
-- else in the catalog, matching what the flat 'verified' tier granted
-- before this migration, plus formulary (new).
-- ----------------------------------------------------------------------
insert into public.role_permissions (role, permission_key, granted)
select 'verified_pharmacist', key, true
from public.permissions
on conflict (role, permission_key) do nothing;
