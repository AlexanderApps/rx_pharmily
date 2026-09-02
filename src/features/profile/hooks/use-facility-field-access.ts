import { useCallback } from "react";
import { FacilityProfile } from "@/features/profile/types/profile.types";
import { useFacilityViewerRole } from "@/features/profile/hooks/use-facility-viewer-role";
import { facilityFieldVisibility } from "@/features/profile/utils/facility-field-visibility";

/**
 * The single call most facility screens/components need:
 *
 *   const { role, canSee } = useFacilityFieldAccess(facility);
 *   {canSee("phone") && <Field label="Phone" value={facility.phone} />}
 *   {role === "owner" && <EditButton />}
 *
 * `role` is also useful directly for action-level gating (who can
 * edit, approve, manage members) — see useFacilityViewerRole's own
 * comment for the owner > admin > member > guest precedence.
 */
export function useFacilityFieldAccess(facility: FacilityProfile | undefined) {
  const role = useFacilityViewerRole(facility);

  const canSee = useCallback(
    (key: keyof FacilityProfile) => (facility ? facilityFieldVisibility.canSee(facility, role, key) : false),
    [facility, role],
  );

  return { role, canSee };
}
