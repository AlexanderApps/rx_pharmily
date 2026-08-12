import React, { useMemo } from "react";
import { View, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";

const WebTopBar: React.FC = () => {
  const { colors } = useTheme();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <View
      className="h-16 flex-row items-center justify-between px-6"
      style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View
        className="h-9 w-full max-w-sm flex-row items-center gap-2 rounded-lg px-3"
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
        <TextInput
          placeholder="Search RxRFQs, donations, jobs..."
          placeholderTextColor={colors.textSecondary}
          className="flex-1 text-[13px]"
          style={{ color: colors.text, outline: "none" as any }}
        />
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.push("/notifications")}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons name="bell-outline" size={17} color={colors.text} />
          {unreadCount > 0 && (
            <View
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.error }}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default WebTopBar;
