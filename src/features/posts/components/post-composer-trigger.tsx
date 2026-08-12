import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";


const PostComposerTrigger: React.FC = () => {
  const { colors } = useTheme();
  const currentUser = useProfileStore((state) => state.user);
  const initials = currentUser.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Pressable
      onPress={() => router.push("/posts/create-post")}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: currentUser.avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
        Share something with the community...
      </Text>
    </Pressable>
  );
};

export default PostComposerTrigger;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  placeholder: { fontSize: 13, flex: 1 },
});
