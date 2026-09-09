-- ============================================================================
-- Facilities: delivery options and accepted insurance providers.
-- ============================================================================
-- insurance_providers is a new admin-managed reference table, following
-- the exact same pattern as every other one in
-- 20260824000000_reference_lookup_tables.sql (units_of_measurement,
-- medication_categories, etc.) — readable by any authenticated user,
-- writable only by admins.
--
-- Both new facility columns store text[] of NAMES directly, not uuid
-- foreign keys into a junction table — matching how rxrfqs.categories
-- and donations.categories already work in this schema. Simpler to
-- read/write from the client (a plain array update, not a separate
-- table's rows to insert/delete), consistent with the one multi-select
-- pattern this app already has, at the cost of no DB-level referential
-- integrity if a reference row is ever deleted — an acceptable trade
-- given reference data here is essentially never deleted, only added to.
--
-- delivery_options is NOT reference-data-managed like insurance is —
-- the request that led to this migration only asked for insurance
-- options to be admin-manageable, not delivery options, which is also a
-- much smaller, more stable set in practice. A check constraint keeps
-- it valid without the overhead of a full reference table + admin CRUD
-- UI for four fixed values.

create table public.insurance_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.insurance_providers enable row level security;

create policy "insurance providers readable by authenticated users"
  on public.insurance_providers for select
  to authenticated
  using (true);

create policy "admins manage insurance providers"
  on public.insurance_providers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.facilities
  add column insurance_accepted text[] not null default '{}',
  add column delivery_options text[] not null default '{}'
    check (
      delivery_options <@ array['Pickup', 'Home Delivery', 'Courier Delivery', 'Same-Day Delivery']::text[]
    );
