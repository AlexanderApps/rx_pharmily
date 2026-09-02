-- ============================================================================
-- Reference/lookup tables: units of measurement, medication categories,
-- regions (Ghana's 16)
-- ============================================================================
-- Standalone lookup tables, matching the existing pattern for reference
-- data shared by the whole app (see public.products above): readable by
-- every authenticated user, writable only by admins. Not linked to any
-- existing column yet — products.category/default_unit and
-- formulary_requests.category/default_unit are still plain text, as is
-- facilities.region. Wiring those columns to reference these tables
-- (via a foreign key, or just validating against them at the
-- application layer) is a separate, deliberate follow-up decision, not
-- done here.

create table public.units_of_measurement (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text,
  created_at timestamptz not null default now()
);

alter table public.units_of_measurement enable row level security;

create policy "units of measurement readable by authenticated users"
  on public.units_of_measurement for select
  to authenticated
  using (true);

create policy "admins manage units of measurement"
  on public.units_of_measurement for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.units_of_measurement (name, abbreviation) values
  ('Tablet', 'TAB'),
  ('Capsule', 'CAP'),
  ('Bottle', 'BTL'),
  ('Box', 'BOX'),
  ('Vial', 'VIAL'),
  ('Ampoule', 'AMP'),
  ('Sachet', 'SCT'),
  ('Tube', 'TUBE'),
  ('Carton', 'CTN'),
  ('Strip', 'STRIP'),
  ('Syringe', 'SYR'),
  ('Pack', 'PACK'),
  ('Roll', 'ROLL'),
  ('Kit', 'KIT'),
  ('Pair', 'PAIR'),
  ('Piece', 'PC'),
  ('Unit', 'UNIT');

-- ----------------------------------------------------------------------

create table public.medication_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.medication_categories enable row level security;

create policy "medication categories readable by authenticated users"
  on public.medication_categories for select
  to authenticated
  using (true);

create policy "admins manage medication categories"
  on public.medication_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.medication_categories (name) values
  ('Antibiotics'),
  ('Analgesics & Pain Relief'),
  ('Antimalarials'),
  ('Antihypertensives'),
  ('Antidiabetics'),
  ('Antihistamines & Allergy'),
  ('Antivirals'),
  ('Antifungals'),
  ('Vitamins & Supplements'),
  ('Gastrointestinal'),
  ('Respiratory'),
  ('Cardiovascular'),
  ('Dermatological'),
  ('Ophthalmic'),
  ('Vaccines'),
  ('Contraceptives & Reproductive Health'),
  ('Anesthetics'),
  ('Psychiatric & Neurological'),
  ('Oncology'),
  ('First Aid & Wound Care'),
  ('Other');

-- ----------------------------------------------------------------------
-- Ghana's 16 administrative regions, current as of the December 2018
-- reorganization (verified against current sources, not assumed from
-- training data alone, given the consequence of getting a country's
-- own administrative divisions wrong in a seeded reference table).

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.regions enable row level security;

create policy "regions readable by authenticated users"
  on public.regions for select
  to authenticated
  using (true);

create policy "admins manage regions"
  on public.regions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.regions (name) values
  ('Ahafo'),
  ('Ashanti'),
  ('Bono'),
  ('Bono East'),
  ('Central'),
  ('Eastern'),
  ('Greater Accra'),
  ('North East'),
  ('Northern'),
  ('Oti'),
  ('Savannah'),
  ('Upper East'),
  ('Upper West'),
  ('Volta'),
  ('Western'),
  ('Western North');
