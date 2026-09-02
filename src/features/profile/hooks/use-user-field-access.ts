import { useCallback } from "react";
import { UserProfile } from "@/features/profile/types/profile.types";
import { useUserViewerRole } from "@/features/profile/hooks/use-user-viewer-role";
import { userFieldVisibility } from "@/features/profile/utils/user-field-visibility";

/**
 *   const { role, canSee } = useUserFieldAccess(profile);
 *   {canSee("phone") && <Field label="Phone" value={profile.phone} />}
 *   {role === "owner" && <EditButton />}
 */
export function useUserFieldAccess(profile: UserProfile | undefined) {
  const role = useUserViewerRole(profile);

  const canSee = useCallback(
    (key: keyof UserProfile) => (profile ? userFieldVisibility.canSee(profile, role, key) : false),
    [profile, role],
  );

  return { role, canSee };
}
