-- ============================================================================
-- Donation visibility rules — matching rxrfq/mediscope's existing pattern
-- ============================================================================
-- donations currently has no visibility concept at all — every non-
-- deleted donation is visible to every authenticated user, full stop.
-- This brings it in line with rxrfqs and mediscope_requests, both of
-- which already support an "All" vs "Restricted" scope with rules
-- matching by region, facility type, or a specific facility.
--
-- Reuses rxrfq_visibility_scope / rxrfq_visibility_rule_type rather than
-- defining donation-specific duplicates — mediscope_visibility_rules
-- already established this convention (its own rule_type column uses
-- the same rxrfq_visibility_rule_type enum), since the type itself is
-- generic (it's just "All"/"Restricted" and "Region"/"Facility Type"/
-- "Specific Facility"), not actually coupled to rxrfqs specifically.

alter table public.donations add column visibility_scope rxrfq_visibility_scope not null default 'All';

create table public.donation_visibility_rules (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  rule_type rxrfq_visibility_rule_type not null,
  region text,
  facility_type text,
  facility_id uuid references public.facilities(id)
);

create index idx_donation_visibility_rules_donation_id on public.donation_visibility_rules(donation_id);

alter table public.donation_visibility_rules enable row level security;

-- Same shape as can_view_rxrfq()/can_view_mediscope_request() — a
-- Restricted donation is only visible to facilities matching one of its
-- rules.
create or replace function public.can_view_donation(p_donation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.donations d
      where d.id = p_donation_id and d.visibility_scope = 'All'
    )
    or exists (
      select 1
      from public.donation_visibility_rules vr
      join public.facility_memberships fm on fm.user_id = auth.uid()
      join public.facilities f on f.id = fm.facility_id
      where vr.donation_id = p_donation_id
        and (
          (vr.rule_type = 'Specific Facility' and vr.facility_id = f.id)
          or (vr.rule_type = 'Region' and vr.region = f.region)
          or (vr.rule_type = 'Facility Type' and vr.facility_type = f.type::text)
        )
    );
$$;

-- Replaces the existing select policy (which only checked deleted_at)
-- with one that also honors visibility_scope/visibility_rules, same
-- structure as rxrfqs' own select policy: admins see everything, the
-- creator and their facility members see their own regardless of
-- status, everyone else only sees 'opened' donations that pass the
-- visibility check.
drop policy "donations readable by authenticated users" on public.donations;
create policy "donations readable by authenticated users"
  on public.donations for select
  to authenticated
  using (
    (deleted_at is null or public.is_admin())
    and (
      public.is_admin()
      or created_by = auth.uid()
      or public.is_facility_member(facility_id)
      or (status = 'opened' and public.can_view_donation(id))
    )
  );

drop policy "donation items readable by authenticated users" on public.donation_items;
create policy "donation items readable by authenticated users"
  on public.donation_items for select
  to authenticated
  using (exists (
    select 1 from public.donations d where d.id = donation_id and (
      (d.deleted_at is null or public.is_admin())
      and (
        public.is_admin() or d.created_by = auth.uid() or public.is_facility_member(d.facility_id)
        or (d.status = 'opened' and public.can_view_donation(d.id))
      )
    )
  ));

create policy "donation visibility rules follow parent"
  on public.donation_visibility_rules for select
  to authenticated
  using (exists (
    select 1 from public.donations d where d.id = donation_id and (
      public.is_admin() or d.created_by = auth.uid() or public.is_facility_member(d.facility_id)
    )
  ));

create policy "facility members manage own donation visibility rules"
  on public.donation_visibility_rules for all
  to authenticated
  using (exists (
    select 1 from public.donations d where d.id = donation_id and (public.is_facility_member(d.facility_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.donations d where d.id = donation_id and (public.is_facility_member(d.facility_id) or public.is_admin())
  ));
