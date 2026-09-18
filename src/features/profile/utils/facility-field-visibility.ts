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
    // Unconditional only for owner/admin — they're the ones who manage
    // this setting and need to see the actual value to decide whether
    // to expose it. A plain member follows the same "only if public"
    // rule as a guest; membership alone isn't the same as owning or
    // moderating the facility's contact details.
    visibleTo: (facility, role) => role === "owner" || role === "admin" || facility.publicVisibility.showPhone,
  },
  {
    key: "email",
    visibleTo: (facility, role) => role === "owner" || role === "admin" || facility.publicVisibility.showEmail,
  },
  {
    key: "registrationNumber",
    // A business identifier, not something a guest browsing to join
    // needs — but a member (not just the owner) reasonably needs this
    // for facility business, e.g. citing it on a form.
    visibleTo: (_facility, role) => role === "owner" || role === "admin" || role === "member",
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
