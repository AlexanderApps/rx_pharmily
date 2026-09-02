// Mirrors supabase/migrations/20260829000000_nearby_distance_functions.sql's
// haversine_km() exactly — same formula, same clamping — so a distance
// computed here and one computed by the nearby_* RPCs never disagree.
//
// For "how far is this specific facility from me": the client already
// has the facility's lat/lng (already loaded in the facilities store)
// and the user's current position (from expo-location, the same
// mechanism shared/components/location-picker.tsx already uses), so
// there's no reason to round-trip to the database just to compute a
// number both sides already have the inputs for. The nearby_* RPCs
// exist for the different problem of filtering/sorting many rows by
// distance server-side — not for this.

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lng points, in kilometers.
 * Returns null if either point is missing a coordinate — callers
 * should treat that as "distance unknown", not zero.
 */
export function haversineKm(
  lat1: number | undefined | null,
  lng1: number | undefined | null,
  lat2: number | undefined | null,
  lng2: number | undefined | null,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;

  const a =
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lng2) - toRadians(lng1)) +
    Math.sin(toRadians(lat1)) * Math.sin(toRadians(lat2));

  // Same guard as the SQL version — clamp before acos() so a
  // near-identical pair of points (fractionally above 1 due to
  // floating-point error) doesn't produce NaN.
  return EARTH_RADIUS_KM * Math.acos(Math.min(1, a));
}

/**
 * Formats a distance for display — "850 m away" under 1km, otherwise
 * "N.N km away" to one decimal place. Returns null (not a string) when
 * distanceKm itself is null, so callers can decide how to render
 * "unknown" rather than this baking in a specific fallback string.
 */
export function formatDistance(distanceKm: number | null): string | null {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}
