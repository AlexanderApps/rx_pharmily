import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useChatStore } from "@/features/chat/hooks/use-chat-data";
import { KycEntityType } from "@/features/profile/types/profile.types";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";

export interface PublicProfileTarget {
  entityType: KycEntityType;
  entityId: string;
}

interface PublicProfileCardProps extends PublicProfileTarget {
  visible: boolean;
  onClose: () => void;
  // Used when entityId doesn't resolve against the profile store — e.g. a
  // post author or chat participant whose id comes from that feature's own
  // mock data rather than features/profile's small user pool. Without this
  // the card would show "Unknown user" for anyone outside that pool.
  fallbackName?: string;
  fallbackAvatarColor?: string;
  fallbackSubtitle?: string;
}

const PublicProfileCard: React.FC<PublicProfileCardProps> = ({
  entityType,
  entityId,
  visible,
  onClose,
  fallbackName,
  fallbackAvatarColor,
  fallbackSubtitle,
}) => {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const getUserDisplay = useProfileStore((state) => state.getUserDisplay);
  const startConversation = useChatStore((state) => state.startConversation);
  const [isMessaging, setIsMessaging] = useState(false);
  const startFacilityConversation = useChatStore((state) => state.startFacilityConversation);

  const facility = useMemo(
    () => (entityType === "facility" ? facilities.find((f) => f.id === entityId) : undefined),
    [entityType, entityId, facilities],
  );
  const organization = useMemo(
    () => (entityType === "organization" ? organizations.find((o) => o.id === entityId) : undefined),
    [entityType, entityId, organizations],
  );
  const isCurrentUser = entityType === "user" && entityId === currentUserId;

  if (!visible) return null;

  let name = "Unknown";
  let subtitle = "";
  let avatarColor = "#64748b";
  let icon: keyof typeof MaterialCommunityIcons.glyphMap = "account-outline";
  let email: string | undefined;
  let phone: string | undefined;
  let showEmail = false;
  let showPhone = false;
  let kycStatus: "unverified" | "pending" | "verified" | "rejected" = "unverified";
  let bio: string | undefined;
  let messageTargetUserId: string | undefined;
  let facilityMessageTarget: { id: string; name: string } | undefined;

  if (entityType === "user") {
    const isMe = entityId === currentUserId;
    if (isMe) {
      name = user.fullName;
      avatarColor = user.avatarColor;
      subtitle = user.role;
      email = user.email;
      phone = user.phone;
      showEmail = user.publicVisibility.showEmail;
      showPhone = user.publicVisibility.showPhone;
      kycStatus = user.kyc.status;
      bio = user.bio;
    } else if (fallbackName) {
      name = fallbackName;
      avatarColor = fallbackAvatarColor ?? avatarColor;
      subtitle = fallbackSubtitle ?? "";
    } else {
      const target = getUserDisplay(entityId);
      name = target.name;
      avatarColor = target.avatarColor;
    }
    icon = "account-outline";
    messageTargetUserId = entityId;
  } else if (entityType === "facility") {
    icon = "hospital-building";
    if (facility) {
      name = facility.name;
      subtitle = `${facility.type} · ${facility.location}`;
      avatarColor = "#16a34a";
      email = facility.email;
      phone = facility.phone;
      showEmail = facility.publicVisibility.showEmail;
      showPhone = facility.publicVisibility.showPhone;
      kycStatus = facility.kyc.status;
      // Facility messaging is now a group conversation visible to every
      // current member, not a private DM with just the admin — see
      // facilityMessageTarget below and its use in handleMessage.
      facilityMessageTarget = { id: facility.id, name: facility.name };
    } else if (fallbackName) {
      // Not one of the profile store's own facilities — e.g. an RxRFQ,
      // Donation, or MediScope posting, which each track facilities in
      // their own feature-local data rather than features/profile's list.
      name = fallbackName;
      subtitle = fallbackSubtitle ?? "";
      avatarColor = fallbackAvatarColor ?? "#16a34a";
    }
  } else if (entityType === "organization") {
    icon = "domain";
    if (organization) {
      name = organization.name;
      subtitle =
        organization.type + (organization.headquartersLocation ? ` · ${organization.headquartersLocation}` : "");
      avatarColor = "#9333ea";
      email = organization.email;
      phone = organization.phone;
      showEmail = organization.publicVisibility.showEmail;
      showPhone = organization.publicVisibility.showPhone;
      kycStatus = organization.kyc.status;
      messageTargetUserId = organization.adminUserId;
    } else if (fallbackName) {
      name = fallbackName;
      subtitle = fallbackSubtitle ?? "";
      avatarColor = fallbackAvatarColor ?? "#9333ea";
    }
  }

  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleMessage = async () => {
    if (isMessaging) return;
    setIsMessaging(true);
    let conversationId: string;

    if (facilityMessageTarget) {
      conversationId = await startFacilityConversation(facilityMessageTarget);
    } else if (messageTargetUserId) {
      // For a "user" card, name/avatarColor here are already the resolved
      // display (real profile data or the caller's fallback) — reuse them
      // rather than re-resolving, since getUserDisplay only knows about
      // the small features/profile user pool and would show "Unknown
      // user" for anyone outside it (e.g. a post author).
      const isDirectUser = entityType === "user";
      const targetDisplay = isDirectUser
        ? { id: messageTargetUserId, name, avatarColor }
        : getUserDisplay(messageTargetUserId);
      conversationId = await startConversation({
        id: targetDisplay.id,
        name: isDirectUser ? name : `${name} (${targetDisplay.name})`,
        facility: "",
        avatarColor: targetDisplay.avatarColor,
      });
    } else {
      setIsMessaging(false);
      return;
    }

    setIsMessaging(false);

    if (!conversationId) return;
    onClose();
    router.push({ pathname: "/chat/thread", params: { id: conversationId } });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.backgroundSecondary }]} onPress={() => {}}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            {entityType === "user" ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <MaterialCommunityIcons name={icon} size={30} color="#fff" />
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.badgeRow}>
            <KycStatusBadge status={kycStatus} compact />
          </View>

          {bio ? <Text style={[styles.bio, { color: colors.textSecondary }]}>{bio}</Text> : null}

          {(showEmail && email) || (showPhone && phone) ? (
            <View style={[styles.contactBlock, { backgroundColor: colors.backgroundElement }]}>
              {showEmail && email && (
                <View style={styles.contactRow}>
                  <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              )}
              {showPhone && phone && (
                <View style={styles.contactRow}>
                  <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{phone}</Text>
                </View>
              )}
            </View>
          ) : null}

          {!isCurrentUser && (messageTargetUserId || facilityMessageTarget) && (
            <Pressable
              onPress={handleMessage}
              disabled={isMessaging}
              style={[styles.messageButton, { backgroundColor: colors.primary, opacity: isMessaging ? 0.6 : 1 }]}
            >
              {isMessaging ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="chat-outline" size={16} color="#fff" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </>
              )}
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PublicProfileCard;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.15)",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  name: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 13, textAlign: "center" },
  badgeRow: { marginTop: 6 },
  bio: { fontSize: 13, textAlign: "center", marginTop: 10, lineHeight: 18 },
  contactBlock: { width: "100%", borderRadius: 12, padding: 12, gap: 8, marginTop: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 13, flex: 1 },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    marginTop: 16,
  },
  messageButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
