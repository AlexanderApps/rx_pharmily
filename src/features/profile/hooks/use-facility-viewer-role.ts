import { useMemo } from "react";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { FacilityProfile } from "@/features/profile/types/profile.types";
import { ViewerRole } from "@/shared/utils/field-visibility";

/**
 * One canonical answer to "what is the signed-in person, relative to
 * this facility" — owner, member, admin, or guest. Call this instead of
 * independently reaching into facilityMemberships/currentUserId/
 * accountRole in each screen — that's how the same logical check drifts
 * into subtly different answers across screens (which is exactly what
 * had happened before this hook existed: facility-profile.tsx's own
 * isOwner/isMember check was never shared with anywhere else that
 * needed the same answer).
 *
 * Precedence: owner > admin > member > guest.
 * - Owning THIS facility is treated as more specific/relevant than
 *   platform admin status, so an admin who also happens to own the
 *   facility sees the owner-level experience, not a generic admin one.
 * - Platform admin still outranks plain membership — admins need full
 *   visibility for moderation regardless of whether they happen to
 *   also be a member.
 * Adjust this ordering here if that priority doesn't match your
 * intent — it's the one place that decides it for every caller.
 */
export function useFacilityViewerRole(facility: FacilityProfile | undefined): ViewerRole {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isPlatformAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);

  return useMemo(() => {
    if (!facility) return "guest";

    const myMembership = facilityMemberships.find(
      (m) => m.facilityId === facility.id && m.userId === currentUserId,
    );

    if (myMembership?.role === "Owner") return "owner";
    if (isPlatformAdmin) return "admin";
    if (myMembership) return "member";
    return "guest";
  }, [facility, facilityMemberships, currentUserId, isPlatformAdmin]);
}
