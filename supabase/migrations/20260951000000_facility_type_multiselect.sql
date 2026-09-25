-- ============================================================================
-- Facility type: fixed enum -> admin-extensible reference data + multiselect.
-- ============================================================================
-- Mirrors insurance_providers' exact shape/RLS — the simplest existing
-- reference-data table (id/name/description), not the categories tables
-- with an extra tags/parent structure none of them actually have either.
create table public.facility_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.facility_types enable row level security;

create policy "facility types readable by authenticated users"
  on public.facility_types for select
  to authenticated
  using (true);

create policy "admins manage facility types"
  on public.facility_types for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed with the exact 6 values the old facility_type enum had, so no
-- existing facility's type silently becomes unrecognized.
insert into public.facility_types (name) values
  ('Retail Pharmacy'),
  ('Hospital'),
  ('Wholesale Distributor'),
  ('Diagnostic Lab'),
  ('Clinic'),
  ('Other');

-- facilities.type: single facility_type enum value -> text[] of names
-- (referencing facility_types.name, the same "array of reference-data
-- names" pattern rxrfqs.categories and donations.categories already
-- use — not a join table, since a facility having 1-6 types doesn't
-- need one). The USING clause wraps each existing single value in a
-- one-element array, so no facility loses its type in the migration.
alter table public.facilities
  alter column type drop default;
alter table public.facilities
  alter column type type text[] using array[type::text];
alter table public.facilities
  alter column type set default array['Retail Pharmacy']::text[];
-- A facility must have at least one type — the array equivalent of the
-- old column's own "not null" (which alone would now only guarantee a
-- non-null array, not a non-empty one).
alter table public.facilities
  add constraint facilities_type_not_empty check (array_length(type, 1) > 0);

-- The old facility_type enum type itself is left in place, unused —
-- Postgres enum types can't be dropped while anything might still
-- reference them transitively, and there's no correctness reason to
-- force that cleanup now.

-- ============================================================================
-- Visibility-rule matching: facility_type = f.type::text -> = ANY(f.type)
-- ============================================================================
-- Each of these three functions checks whether a "Facility Type" scoped
-- visibility rule matches a given facility. They all previously compared
-- the rule's single facility_type value against f.type::text — a clean
-- scalar-to-scalar comparison when f.type was one enum value. Now that
-- f.type is an array, ::text on it produces its literal array syntax
-- (e.g. "{Retail Pharmacy,Hospital}"), which would never equal a plain
-- rule value again — silently breaking every "Facility Type" visibility
-- rule for RxRFQ, MediScope, and Donations at once. = ANY(f.type) is the
-- correct check: does the rule's type appear anywhere in this facility's
-- (possibly multiple) types.
create or replace function public.can_view_rxrfq(p_rxrfq_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.rxrfqs r
      where r.id = p_rxrfq_id and r.visibility_scope = 'All'
    )
    or exists (
      select 1
      from public.rxrfq_visibility_rules vr
      join public.facility_memberships fm on fm.user_id = auth.uid()
      join public.facilities f on f.id = fm.facility_id
      where vr.rxrfq_id = p_rxrfq_id
        and (
          (vr.rule_type = 'Specific Facility' and vr.facility_id = f.id)
          or (vr.rule_type = 'Region' and vr.region = f.region)
          or (vr.rule_type = 'Facility Type' and vr.facility_type = any(f.type))
        )
    );
$$;

create or replace function public.can_view_mediscope(p_request_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.mediscope_requests r
      where r.id = p_request_id and r.visibility_scope = 'All'
    )
    or exists (
      select 1
      from public.mediscope_visibility_rules vr
      join public.facility_memberships fm on fm.user_id = auth.uid()
      join public.facilities f on f.id = fm.facility_id
      where vr.request_id = p_request_id
        and (
          (vr.rule_type = 'Specific Facility' and vr.facility_id = f.id)
          or (vr.rule_type = 'Region' and vr.region = f.region)
          or (vr.rule_type = 'Facility Type' and vr.facility_type = any(f.type))
        )
    );
$$;

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
          or (vr.rule_type = 'Facility Type' and vr.facility_type = any(f.type))
        )
    );
$$;

-- ============================================================================
-- facility_org_requests.type: same enum -> text[] change, for consistency
-- ============================================================================
-- The facility creation-request form should offer the same multiselect
-- type field the approved facility record itself now has, not a
-- single-select that then has to somehow become the multiselect value
-- once approved.
alter table public.facility_creation_requests
  alter column type drop default;
alter table public.facility_creation_requests
  alter column type type text[] using array[type::text];
alter table public.facility_creation_requests
  alter column type set default array['Retail Pharmacy']::text[];

