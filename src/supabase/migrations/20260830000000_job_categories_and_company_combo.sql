-- ============================================================================
-- Job categories, multiselect categories on jobs, and the company combo
-- ============================================================================

-- Same pattern as medication_categories/units_of_measurement/etc — readable
-- by every authenticated user, writable only by admins. Seeded with a
-- starting set covering both axes mentioned when this was requested:
-- role-type (e.g. Superintendent — a pharmacist whose own license is
-- available to be used for licensing the facility) and travel expectation
-- (Local vs Overseas), plus a few other common pharmacy-job-board
-- categories. Multiselect on jobs (jobs.categories text[] below) lets a
-- single listing carry more than one — e.g. "Superintendent" + "Local".

create table public.job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.job_categories enable row level security;

create policy "job categories readable by authenticated users"
  on public.job_categories for select
  to authenticated
  using (true);

create policy "admins manage job categories"
  on public.job_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.job_categories (name, description) values
  ('Superintendent', 'The pharmacist must hold an active license and have it available for use in licensing the facility.'),
  ('Local', 'Based within the country — no relocation or international travel expected.'),
  ('Overseas', 'Based outside the country, or involves relocation/international travel.'),
  ('Full-Time', 'Standard full-time employment.'),
  ('Part-Time', 'Part-time or reduced-hours employment.'),
  ('Locum / Relief', 'Short-term or temporary cover.'),
  ('Entry-Level', 'Suitable for a newly licensed or early-career pharmacist.'),
  ('Management', 'Includes supervisory or facility-management responsibilities.');

alter table public.jobs add column categories text[] not null default '{}';

-- ============================================================================
-- Company: facility, organization, or a free-text custom name
-- ============================================================================
-- company_name was the only representation until now — always required,
-- never linked to a real facility or organization. This adds the two
-- real links as an alternative, with is_custom marking which mode a
-- given row is in. company_name is now only populated for is_custom
-- rows; when linked to a facility or organization, the display name is
-- derived client-side from the already-loaded store at read time (same
-- pattern already used for donations.facility_id -> facilityName in
-- mapDonationRow), not stored redundantly here.
--
-- is_custom defaults to true deliberately: every row that exists before
-- this migration only has company_name set, so this default correctly
-- marks all of them as custom without a separate backfill statement.
-- Going forward the app sets this explicitly based on which option the
-- poster picks (facility / organization / custom).

alter table public.jobs alter column company_name drop not null;
alter table public.jobs add column facility_id uuid references public.facilities(id);
alter table public.jobs add column organization_id uuid references public.organizations(id);
alter table public.jobs add column is_custom boolean not null default true;

alter table public.jobs add constraint jobs_company_representation_check check (
  (is_custom and company_name is not null and facility_id is null and organization_id is null)
  or (not is_custom and company_name is null and (facility_id is not null or organization_id is not null) and not (facility_id is not null and organization_id is not null))
);

-- ============================================================================
-- Distance — nearby_jobs
-- ============================================================================
-- Same security invoker reasoning as the other nearby_* functions in
-- 20260829000000_nearby_distance_functions.sql: this runs as the calling
-- user, so the existing "open jobs public, others visible to poster or
-- admin" policy applies automatically — no visibility logic duplicated
-- here.
--
-- Unlike the other nearby_* functions, a job's coordinates can come from
-- either its linked facility or its linked organization (or neither, for
-- a custom/unregistered company) — coalesce() picks whichever is
-- present; a job with neither (facility_id and organization_id both
-- null, i.e. every is_custom row) has no coordinates and is correctly
-- excluded, same as any row with null coordinates already is.

create or replace function public.nearby_jobs(
  user_lat double precision,
  user_lng double precision,
  max_km double precision default null
)
returns table(id uuid, distance_km double precision)
language sql
security invoker
set search_path = public
stable
as $$
  select
    j.id,
    public.haversine_km(
      user_lat, user_lng,
      coalesce(f.latitude, o.latitude),
      coalesce(f.longitude, o.longitude)
    ) as distance_km
  from public.jobs j
  left join public.facilities f on f.id = j.facility_id
  left join public.organizations o on o.id = j.organization_id
  where coalesce(f.latitude, o.latitude) is not null
    and coalesce(f.longitude, o.longitude) is not null
    and (
      max_km is null
      or public.haversine_km(
        user_lat, user_lng,
        coalesce(f.latitude, o.latitude),
        coalesce(f.longitude, o.longitude)
      ) <= max_km
    )
  order by distance_km asc;
$$;
