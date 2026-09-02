import { useCallback } from "react";
import { OrganizationProfile } from "@/features/profile/types/profile.types";
import { useOrganizationViewerRole } from "@/features/profile/hooks/use-organization-viewer-role";
import { organizationFieldVisibility } from "@/features/profile/utils/organization-field-visibility";

/**
 *   const { role, canSee } = useOrganizationFieldAccess(organization);
 *   {canSee("phone") && <Field label="Phone" value={organization.phone} />}
 *   {role === "owner" && <EditButton />}
 */
export function useOrganizationFieldAccess(organization: OrganizationProfile | undefined) {
  const role = useOrganizationViewerRole(organization);

  const canSee = useCallback(
    (key: keyof OrganizationProfile) =>
      organization ? organizationFieldVisibility.canSee(organization, role, key) : false,
    [organization, role],
  );

  return { role, canSee };
}
