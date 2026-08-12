import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { AppNotification } from "@/features/notifications/types/notifications.types";
import NotificationListItem from "@/features/notifications/components/notification-list-item";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications],
  );
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handlePress = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </Text>
        </View>
        <Pressable onPress={() => router.push("/notifications/settings")} style={styles.back}>
          <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {unreadCount > 0 && (
        <Pressable onPress={markAllRead} style={styles.markAllRow}>
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
        </Pressable>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bell-off-outline" size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No notifications yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationListItem notification={item} onPress={handlePress} onDelete={deleteNotification} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  markAllRow: { paddingHorizontal: 16, paddingTop: 12 },
  markAllText: { fontSize: 13, fontWeight: "600" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
});
