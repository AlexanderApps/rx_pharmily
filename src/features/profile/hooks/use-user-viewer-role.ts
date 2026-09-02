import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { UserProfile } from "@/features/profile/types/profile.types";
import { ViewerRole } from "@/shared/utils/field-visibility";

/**
 * Same idea as useFacilityViewerRole/useOrganizationViewerRole, for a
 * user's own profile. "owner" here means "this is my own profile," not
 * a facility/org-style ownership relationship — someone always owns
 * their own profile. No "member" case, same as organizations.
 *
 * Precedence: owner > admin > guest. Being the profile's own person
 * outranks platform admin status, same reasoning as the other two
 * domains.
 *
 * Note on current usage: app/profile/user-profile.tsx today only ever
 * renders state.user (the signed-in person's own profile, per this
 * app's established convention — see useProfileStore), so viewerRole
 * there will always resolve to "owner" in practice until a screen for
 * viewing *someone else's* user profile exists (PublicProfileCard
 * already renders user-type profiles read-only, and would be a natural
 * place to route "admin"/"guest" viewers through once that screen is
 * built out further). The hook is written generically now so that
 * future screen can adopt it without changes here.
 */
export function useUserViewerRole(profile: UserProfile | undefined): ViewerRole {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isPlatformAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  return useMemo(() => {
    if (!profile) return "guest";
    if (profile.id === currentUserId) return "owner";
    if (isPlatformAdmin) return "admin";
    return "guest";
  }, [profile, currentUserId, isPlatformAdmin]);
}
