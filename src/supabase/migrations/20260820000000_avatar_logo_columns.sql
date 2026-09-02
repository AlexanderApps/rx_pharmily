-- ============================================================================
-- Profile pictures for users, logos for facilities and organizations
-- ============================================================================
-- Supplements avatar_color (the initials-circle fallback color, already
-- present on all three tables) rather than replacing it — avatar_color
-- stays as the fallback whenever no image has been uploaded, so nothing
-- that currently renders an initials circle needs to change to keep
-- working.

alter table public.profiles
  add column avatar_url text;

alter table public.facilities
  add column logo_url text;

alter table public.organizations
  add column logo_url text;
