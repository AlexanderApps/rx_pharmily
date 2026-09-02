import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { OrganizationProfile } from "@/features/profile/types/profile.types";
import { ViewerRole } from "@/shared/utils/field-visibility";

/**
 * Same idea as useFacilityViewerRole, adapted for organizations —
 * organizations have a single adminUserId rather than a membership
 * list, so there's no "member" case here at all; the possible results
 * are just "owner" (you administer this org), "admin" (platform admin),
 * or "guest". ViewerRole still includes "member" for consistency across
 * domains, this hook simply never produces it.
 *
 * Precedence: owner > admin > guest — same reasoning as the facility
 * version: administering this specific org is treated as more relevant
 * than generic platform admin status.
 */
export function useOrganizationViewerRole(organization: OrganizationProfile | undefined): ViewerRole {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isPlatformAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  return useMemo(() => {
    if (!organization) return "guest";
    if (organization.adminUserId === currentUserId) return "owner";
    if (isPlatformAdmin) return "admin";
    return "guest";
  }, [organization, currentUserId, isPlatformAdmin]);
}
