import { createFieldVisibility } from "@/shared/utils/field-visibility";
import { UserProfile } from "@/features/profile/types/profile.types";

// Same idea as facility/organization-field-visibility.ts — add or
// remove an entry to change what's restricted, no component changes
// needed either way.
//
// This only covers *visibility* (canSee). A future *editability* rule
// set — "after KYC verification, the user can no longer edit field X
// themselves, only an admin can" — is a different, related concern:
// who can change a field, not who can see it. That would be a second,
// parallel registry (e.g. userFieldEditability, built the same way
// with createFieldVisibility or a small sibling factory) rather than
// overloading this one, since a field can easily be visible to someone
// who isn't allowed to edit it.
export const userFieldVisibility = createFieldVisibility<UserProfile>([
  {
    key: "phone",
    visibleTo: (profile, role) => role !== "guest" || profile.publicVisibility.showPhone,
  },
  {
    key: "email",
    visibleTo: (profile, role) => role !== "guest" || profile.publicVisibility.showEmail,
  },
  {
    key: "licenseNumber",
    // A professional license number is identifying info in the same
    // spirit as a facility/org registration number — owner/admin only
    // by default, loosen or remove this if guests should see it too.
    visibleTo: (_profile, role) => role === "owner" || role === "admin",
  },
]);
