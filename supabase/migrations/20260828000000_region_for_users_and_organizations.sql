-- ============================================================================
-- Region for users, organizations, and organization requests
-- ============================================================================
-- facilities and facility_creation_requests already have a region column
-- (not null on both, since a facility's physical location always has
-- one). Neither profiles, organizations, nor
-- organization_creation_requests do — this closes that gap so region
-- can be captured consistently for a user's own profile and for an
-- organization the same way it already is for a facility. Nullable on
-- all three: unlike a facility's physical location, a user's or an
-- organization's region isn't necessarily required.

alter table public.profiles add column region text;
alter table public.organizations add column region text;
alter table public.organization_creation_requests add column region text;
