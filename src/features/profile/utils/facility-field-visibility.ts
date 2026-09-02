import { createFieldVisibility } from "@/shared/utils/field-visibility";
import { FacilityProfile } from "@/features/profile/types/profile.types";

// To add a restriction on a new field: add an entry below with a
// `visibleTo` check. To remove one: delete the entry (the field then
// falls back to visible-to-everyone, per createFieldVisibility's
// fail-open default). No component needs to change either way — every
// screen rendering facility fields should be calling
// facilityFieldVisibility.canSee(...) rather than checking these
// conditions itself.
export const facilityFieldVisibility = createFieldVisibility<FacilityProfile>([
  {
    key: "phone",
    // Below "guest" level, this follows the facility's own opt-in
    // setting rather than being unconditionally hidden or shown —
    // matches how PublicProfileCard already treats this field.
    visibleTo: (facility, role) => role !== "guest" || facility.publicVisibility.showPhone,
  },
  {
    key: "email",
    visibleTo: (facility, role) => role !== "guest" || facility.publicVisibility.showEmail,
  },
  {
    key: "registrationNumber",
    // Not currently covered by publicVisibility at all — treated as
    // owner/admin-only here since it's a business identifier, not
    // something a guest browsing to join needs to see. Loosen or
    // remove this rule if that's not the intent.
    visibleTo: (_facility, role) => role === "owner" || role === "admin",
  },
  {
    key: "adminUserId",
    // Internal reference (which user administers this facility) —
    // not a field any screen should render to a guest regardless of
    // publicVisibility, since it's not something the facility opted
    // into exposing at all.
    visibleTo: (_facility, role) => role === "owner" || role === "admin",
  },
]);
