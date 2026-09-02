-- ============================================================================
-- Distance calculation — haversine_km + nearby_* RPCs
-- ============================================================================
-- One generic distance function, reused by a small "nearby" RPC per
-- entity (rxrfqs, mediscope_requests, donations today; more can follow
-- the same pattern later without touching haversine_km itself).
--
-- Every nearby_* function below is deliberately security invoker (the
-- default when security definer isn't specified, but spelled out
-- explicitly here since getting this wrong would be a real, quiet
-- privacy leak): each one's internal select runs as the calling user,
-- so the existing RLS policies on rxrfqs/mediscope_requests/donations —
-- including the visibility_scope/visibility_rules checks — apply
-- automatically. No visibility logic is duplicated here; a
-- 'Restricted' row a user can't see under normal RLS won't show up in
-- these results either, for the same reason a plain select wouldn't
-- return it.

create or replace function public.haversine_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
security invoker
set search_path = public
immutable
as $$
  -- least(1.0, ...) guards against a floating-point result fractionally
  -- above 1 for near-identical points, which would otherwise make
  -- acos() return NaN.
  select 6371 * acos(
    least(1.0,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
      + sin(radians(lat1)) * sin(radians(lat2))
    )
  );
$$;

create or replace function public.nearby_rxrfqs(
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
  select r.id, public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) as distance_km
  from public.rxrfqs r
  join public.facilities f on f.id = r.facility_id
  where f.latitude is not null and f.longitude is not null
    and (
      max_km is null
      or public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) <= max_km
    )
  order by distance_km asc;
$$;

create or replace function public.nearby_mediscope_requests(
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
  select mr.id, public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) as distance_km
  from public.mediscope_requests mr
  join public.facilities f on f.id = mr.facility_id
  where f.latitude is not null and f.longitude is not null
    and (
      max_km is null
      or public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) <= max_km
    )
  order by distance_km asc;
$$;

create or replace function public.nearby_donations(
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
  select d.id, public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) as distance_km
  from public.donations d
  join public.facilities f on f.id = d.facility_id
  where f.latitude is not null and f.longitude is not null
    and (
      max_km is null
      or public.haversine_km(user_lat, user_lng, f.latitude, f.longitude) <= max_km
    )
  order by distance_km asc;
$$;
