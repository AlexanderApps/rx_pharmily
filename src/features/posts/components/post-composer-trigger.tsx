import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

const PostComposerTrigger: React.FC = () => {
  const { colors } = useTheme();
  const currentUser = useProfileStore((state) => state.user);

  // Computes fallback safely
  const initials = useMemo(() => {
    if (!currentUser?.fullName) return "?";

    return currentUser.fullName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [currentUser?.fullName]);

  // Fallback string values for custom properties
  const avatarBgColor = currentUser?.avatarColor || "#ccc";

  return (
    <Pressable
      onPress={() => router.push("/posts/create-post")}
      // NativeWind applies active/pressed states uniformly via `active:opacity-80`
      className="flex-row items-center border rounded-[14px] px-3 py-2.5 w-full active:opacity-80"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      {/* Avatar Container */}
      <View
        className="w-[34px] h-[34px] rounded-full items-center justify-center"
        style={{ backgroundColor: avatarBgColor }}
      >
        <Text className="text-white text-[12px] font-bold">{initials}</Text>
      </View>

      {/* Input Placeholder Text */}
      <Text
        className="text-[13px] flex-1 ml-2.5"
        style={{ color: colors.textSecondary }}
      >
        Share something with the community...
      </Text>
    </Pressable>
  );
};

export default PostComposerTrigger;
