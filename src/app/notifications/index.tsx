import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Header Component section */}
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        actions={
          <Pressable onPress={() => router.push("/notifications/settings")} className="p-1.5">
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} />
          </Pressable>
        }
      />

      {/* Conditional Batch Action Command */}
      {unreadCount > 0 && (
        <Pressable onPress={markAllRead} className="px-4 pt-3">
          <Text className="text-[13px] font-semibold" style={{ color: colors.primary }}>Mark all as read</Text>
        </Pressable>
      )}

      {/* Main Container FlatList Area */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState icon="bell-off-outline" message="No notifications yet." />
        }
        renderItem={({ item }) => (
          <NotificationListItem notification={item} onPress={handlePress} onDelete={deleteNotification} />
        )}
      />
    </SafeAreaView>
  );
}
