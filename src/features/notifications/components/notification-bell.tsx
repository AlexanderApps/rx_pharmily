import React, { useMemo } from "react";
import { Pressable, View, Text } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";

interface NotificationBellProps {
  size?: number;
  color?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ size = 22, color }) => {
  const { colors } = useTheme();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <Pressable onPress={() => router.push("/notifications")} className="w-[34px] h-[34px] items-center justify-center" hitSlop={8}>
      <MaterialCommunityIcons name="bell-outline" size={size} color={color ?? colors.text} />
      {unreadCount > 0 && (
        <View className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full items-center justify-center px-[3px]" style={{ backgroundColor: colors.error }}>
          <Text className="text-white text-[10px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default NotificationBell;

