import { useMemo } from "react";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { OrganizationProfile } from "@/features/profile/types/profile.types";
import { ViewerRole } from "@/shared/utils/field-visibility";

/**
 * Same idea as useFacilityViewerRole — organizations now have a real
 * membership table (organization_memberships) too, so this mirrors
 * that hook's shape exactly: owner (your own organization_memberships
 * row has role 'Admin' — kept as "owner" here, not "admin", matching
 * this app's existing isOrgAdmin = viewerRole === "owner" convention,
 * a UI-level naming choice independent of what the DB enum itself
 * calls that role), admin (platform admin), member (any other
 * organization_memberships row), or guest.
 *
 * organizations.adminUserId is intentionally NOT read here — a DB
 * trigger (sync_organization_admin_membership) keeps it in sync with
 * an 'Admin' organization_memberships row, so that row is the single
 * source of truth this hook needs, same as facility_memberships is for
 * the facility case.
 *
 * Precedence: owner > admin > member > guest — same reasoning as the
 * facility version: administering this specific org is treated as more
 * relevant than generic platform admin status, which still outranks
 * plain membership.
 */
export function useOrganizationViewerRole(organization: OrganizationProfile | undefined): ViewerRole {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isPlatformAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const organizationMemberships = useProfileStore((state) => state.organizationMemberships);

  return useMemo(() => {
    if (!organization) return "guest";

    const myMembership = organizationMemberships.find(
      (m) => m.organizationId === organization.id && m.userId === currentUserId,
    );

    if (myMembership?.role === "Admin") return "owner";
    if (isPlatformAdmin) return "admin";
    if (myMembership) return "member";
    return "guest";
  }, [organization, organizationMemberships, currentUserId, isPlatformAdmin]);
}
