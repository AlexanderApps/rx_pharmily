import { createFieldVisibility } from "@/shared/utils/field-visibility";
import { OrganizationProfile } from "@/features/profile/types/profile.types";

// Same idea as facility-field-visibility.ts — add or remove an entry
// here to change what's restricted, no component changes needed either
// way.
export const organizationFieldVisibility = createFieldVisibility<OrganizationProfile>([
  {
    key: "phone",
    visibleTo: (org, role) => role !== "guest" || org.publicVisibility.showPhone,
  },
  {
    key: "email",
    visibleTo: (org, role) => role !== "guest" || org.publicVisibility.showEmail,
  },
  {
    key: "registrationNumber",
    visibleTo: (_org, role) => role === "owner" || role === "admin",
  },
  {
    key: "adminUserId",
    visibleTo: (_org, role) => role === "owner" || role === "admin",
  },
]);
