-- ============================================================================
-- GPS coordinates for users, facilities, and organizations
-- ============================================================================
-- Supplements the existing text location fields (facilities.location/
-- region/address, organizations.headquarters_location) rather than
-- replacing them — the free-text fields stay as the human-readable
-- label, these columns hold precise coordinates when a person actually
-- captures their device's GPS location via the location picker. Both
-- nullable: GPS capture is optional, never required to save a profile.

alter table public.profiles
  add column location text,
  add column latitude double precision,
  add column longitude double precision;

alter table public.facilities
  add column latitude double precision,
  add column longitude double precision;

alter table public.organizations
  add column latitude double precision,
  add column longitude double precision;

alter table public.facility_creation_requests
  add column latitude double precision,
  add column longitude double precision;

alter table public.organization_creation_requests
  add column latitude double precision,
  add column longitude double precision;
