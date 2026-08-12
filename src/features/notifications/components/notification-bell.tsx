import React, { useMemo } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
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
    <Pressable onPress={() => router.push("/notifications")} style={styles.button} hitSlop={8}>
      <MaterialCommunityIcons name="bell-outline" size={size} color={color ?? colors.text} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default NotificationBell;

const styles = StyleSheet.create({
  button: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
