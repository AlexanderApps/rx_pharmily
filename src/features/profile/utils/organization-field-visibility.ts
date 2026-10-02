import { createFieldVisibility } from "@/shared/utils/field-visibility";
import { OrganizationProfile } from "@/features/profile/types/profile.types";

// Same idea as facility-field-visibility.ts — add or remove an entry
// here to change what's restricted, no component changes needed either
// way.
export const organizationFieldVisibility = createFieldVisibility<OrganizationProfile>([
  {
    key: "phone",
    // Unconditional only for owner/admin — same reasoning as
    // facility-field-visibility.ts: a plain member follows the same
    // "only if public" rule as a guest; membership alone isn't the
    // same as administering the organization's contact details. (This
    // used to read role !== "guest", which was equivalent to
    // owner/admin-only back when "member" could never actually occur
    // for an organization — now that organization_memberships makes it
    // reachable, that equivalence no longer holds.)
    visibleTo: (org, role) => role === "owner" || role === "admin" || org.publicVisibility.showPhone,
  },
  {
    key: "email",
    visibleTo: (org, role) => role === "owner" || role === "admin" || org.publicVisibility.showEmail,
  },
  {
    key: "registrationNumber",
    // A member reasonably needs this for organization business, e.g.
    // citing it on a form — same reasoning as facility's own
    // registrationNumber entry.
    visibleTo: (_org, role) => role === "owner" || role === "admin" || role === "member",
  },
  {
    key: "adminUserId",
    visibleTo: (_org, role) => role === "owner" || role === "admin",
  },
]);
