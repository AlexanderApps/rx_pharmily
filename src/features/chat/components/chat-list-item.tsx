import React from "react";
import { View, Text, Pressable } from "react-native";
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
      className="flex-row gap-3 px-4 py-3 items-start active:bg-background-element"
      style={({ pressed }) => [
        { backgroundColor: pressed ? colors.backgroundElement : "transparent" },
      ]}
    >
      {isFacility ? (
        <View
          className="w-11 h-11 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
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

      <View className="flex-1 gap-0.5">
        <View className="flex-row justify-between gap-2">
          <Text
            className="text-[15px] font-semibold flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary }}
          >
            {fmtRelative(conversation.lastMessageAt)}
          </Text>
        </View>

        {isFacility ? (
          <Text
            className="text-xs"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {participant.memberCount > 0
              ? `${participant.memberCount} member${participant.memberCount === 1 ? "" : "s"}`
              : "Facility"}
          </Text>
        ) : (
          <Text
            className="text-xs"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {participant.facility}
          </Text>
        )}

        <View className="flex-row items-center justify-between gap-2 mt-0.5">
          <Text
            className={`text-[13px] flex-1 ${unreadCount > 0 ? "font-semibold" : "font-normal"}`}
            style={{
              color: unreadCount > 0 ? colors.text : colors.textSecondary,
            }}
            numberOfLines={1}
          >
            {previewText(lastMessage)}
          </Text>
          {unreadCount > 0 && (
            <View
              className="min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {context && (
          <View className="flex-row items-center gap-1 mt-1">
            <MaterialCommunityIcons
              name={context.type === "rfq" ? "file-document-outline" : "heart-search"}
              size={12}
              color={colors.textSecondary}
            />
            <Text
              className="text-[11px]"
              style={{ color: colors.textSecondary }}
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