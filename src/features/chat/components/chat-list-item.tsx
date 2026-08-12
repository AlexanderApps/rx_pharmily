import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { Conversation, ChatMessage } from "@/features/chat/types/chat.types";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";

const fmtRelative = (d: Date) => {
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
};

function previewText(message?: ChatMessage) {
  if (!message) return "No messages yet";
  const currentUserId = useAuthStore.getState().user?.id;
  const prefix = message.senderId === currentUserId ? "You: " : "";
  if (message.linkedEntity) {
    return `${prefix}📎 ${message.linkedEntity.code} — ${message.linkedEntity.title}`;
  }
  return `${prefix}${message.text ?? ""}`;
}

interface ChatListItemProps {
  conversation: Conversation;
  lastMessage?: ChatMessage;
  onPress: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  lastMessage,
  onPress,
}) => {
  const { colors } = useTheme();
  const { participant, unreadCount, context } = conversation;
  const isFacility = participant.kind === "facility";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.backgroundElement : "transparent" },
      ]}
    >
      {isFacility ? (
        <View style={[styles.facilityAvatar, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="office-building" size={20} color="#fff" />
        </View>
      ) : (
        <ClickableAvatar
          entityType="user"
          entityId={participant.id}
          name={participant.name}
          avatarColor={participant.avatarColor}
          subtitle={participant.facility}
          size={44}
        />
      )}

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {fmtRelative(conversation.lastMessageAt)}
          </Text>
        </View>

        {isFacility ? (
          <Text style={[styles.facility, { color: colors.textSecondary }]} numberOfLines={1}>
            {participant.memberCount > 0
              ? `${participant.memberCount} member${participant.memberCount === 1 ? "" : "s"}`
              : "Facility"}
          </Text>
        ) : (
          <Text
            style={[styles.facility, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {participant.facility}
          </Text>
        )}

        <View style={styles.bottomLine}>
          <Text
            style={[
              styles.preview,
              {
                color: unreadCount > 0 ? colors.text : colors.textSecondary,
                fontWeight: unreadCount > 0 ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {previewText(lastMessage)}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {context && (
          <View style={styles.contextRow}>
            <MaterialCommunityIcons
              name={context.type === "rfq" ? "file-document-outline" : "heart-search"}
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.contextText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {context.code}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default ChatListItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  facilityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 15, fontWeight: "600", flex: 1 },
  time: { fontSize: 11 },
  facility: { fontSize: 12 },
  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  preview: { fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  contextRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  contextText: { fontSize: 11 },
});
