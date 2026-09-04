import React, { useMemo } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { noSelectStyle } from "@/shared/constants/text-selection";
import { openGlobalSearch } from "@/shared/hooks/use-global-search";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import { useMobileSidebarStore } from "@/shared/hooks/use-mobile-sidebar";

const WebTopBar: React.FC = () => {
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const toggleMobileSidebar = useMobileSidebarStore((state) => state.toggle);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform ?? "");

  return (
    <View
      className="h-16 flex-row items-center justify-between px-6"
      style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {breakpoint === "compact" && (
          <Pressable
            onPress={toggleMobileSidebar}
            className="h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="menu" size={19} color={colors.text} />
          </Pressable>
        )}
        <Pressable
        onPress={openGlobalSearch}
        className="h-9 flex-1 max-w-sm flex-row items-center gap-2 rounded-lg px-3"
        style={{ backgroundColor: colors.backgroundElement }}
      >
        <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
        <TextInput
          placeholder="Search RxRFQs, donations, jobs..."
          placeholderTextColor={colors.textSecondary}
          editable={false}
          pointerEvents="none"
          className="flex-1 text-[13px]"
          style={{ color: colors.text, outline: "none" as any }}
        />
        {breakpoint !== "compact" && (
          <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, ...noSelectStyle }}>{isMac ? "⌘K" : "Ctrl+K"}</Text>
          </View>
        )}
        </Pressable>
      </View>

      <View className="flex-row items-center gap-3 ml-4">
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
