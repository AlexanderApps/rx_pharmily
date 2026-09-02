import React, { useState } from "react";
import { View, Pressable, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import PublicProfileCard from "@/features/profile/components/public-profile-card";
import LoadingImage from "@/shared/components/loading-image";
import { KycEntityType } from "@/features/profile/types/profile.types";

interface ClickableAvatarProps {
  entityType: KycEntityType;
  entityId: string;
  name: string;
  avatarColor?: string;
  imageUri?: string;
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
  imageUri,
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
      <Pressable onPress={() => setOpen(true)} hitSlop={4}>
        {imageUri ? (
          <LoadingImage
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            borderRadius={size / 2}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor }}
          >
            {entityType === "user" ? (
              <Text className="text-white font-bold" style={{ fontSize: size * 0.4 }}>{initials}</Text>
            ) : (
              <MaterialCommunityIcons name={ENTITY_ICON[entityType]} size={size * 0.55} color="#fff" />
            )}
          </View>
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

