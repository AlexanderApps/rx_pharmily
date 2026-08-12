import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import PublicProfileCard from "@/features/profile/components/public-profile-card";
import { KycEntityType } from "@/features/profile/types/profile.types";

interface ClickableAvatarProps {
  entityType: KycEntityType;
  entityId: string;
  name: string;
  avatarColor?: string;
  subtitle?: string;
  size?: number;
}

const ENTITY_ICON: Record<KycEntityType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  user: "account-outline",
  facility: "hospital-building",
  organization: "domain",
};

const ClickableAvatar: React.FC<ClickableAvatarProps> = ({
  entityType,
  entityId,
  name,
  avatarColor = "#64748b",
  subtitle,
  size = 36,
}) => {
  const [open, setOpen] = useState(false);

  const safeName = name?.trim() || "?";
  const initials =
    entityType === "user"
      ? safeName
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase() || "?"
      : "";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor },
        ]}
        hitSlop={4}
      >
        {entityType === "user" ? (
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        ) : (
          <MaterialCommunityIcons name={ENTITY_ICON[entityType]} size={size * 0.55} color="#fff" />
        )}
      </Pressable>

      <PublicProfileCard
        entityType={entityType}
        entityId={entityId}
        visible={open}
        onClose={() => setOpen(false)}
        fallbackName={name}
        fallbackAvatarColor={avatarColor}
        fallbackSubtitle={subtitle}
      />
    </>
  );
};

export default ClickableAvatar;

const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  initials: { color: "#fff", fontWeight: "700" },
});
