import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { AppNotification, NotificationCategory } from "@/features/notifications/types/notifications.types";

const CATEGORY_ICON: Record<NotificationCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
  rxrfq_new_entry: "file-document-outline",
  rxrfq_response_received: "file-document-edit-outline",
  rxrfq_award_decision: "trophy-outline",
  donation_new_entry: "gift-outline",
  donation_claim_received: "hand-heart-outline",
  donation_claim_decision: "check-decagram-outline",
  mediscope_new_entry: "magnify",
  mediscope_response_received: "magnify-scan",
  jobs_new_entry: "briefcase-outline",
  jobs_application_received: "account-arrow-right-outline",
  jobs_application_status: "clipboard-check-outline",
  ads_status_decision: "bullhorn-outline",
  ads_new_comment: "comment-outline",
  consult_response_received: "account-tie-outline",
  pharmacist_response_received: "pill",
  chat_new_message: "chat-outline",
  kyc_decision: "shield-check-outline",
  facility_member_added: "account-group-outline",
  facility_added_to_organization: "domain",
  formulary_request_decision: "pill",
};

interface NotificationListItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete: (id: string) => void;
}

const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();
  const icon = CATEGORY_ICON[notification.category] ?? "bell-outline";

  return (
    <Pressable
      onPress={() => onPress(notification)}
      className="flex-row items-start gap-3 rounded-[14px] p-3.5"
      style={{
        backgroundColor: notification.read ? colors.backgroundSecondary : colors.primary + "0d",
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
      }}
    >
      <View className="w-9 h-9 rounded-[10px] items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={2}>
          {notification.title}
        </Text>
        <Text className="text-xs mt-0.5 leading-[17px]" style={{ color: colors.textSecondary }} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-[11px] mt-1.5" style={{ color: colors.textSecondary }}>{format(notification.createdAt)}</Text>
      </View>
      {!notification.read && <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: colors.primary }} />}
      <Pressable onPress={() => onDelete(notification.id)} hitSlop={8} className="p-0.5">
        <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
};

export default NotificationListItem;

