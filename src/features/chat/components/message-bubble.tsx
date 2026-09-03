import React from "react";
import { View, Text, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { ChatMessage } from "@/features/chat/types/chat.types";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useChatStore } from "@/features/chat/hooks/use-chat-data";
import LinkedEntityCard from "@/features/chat/components/linked-entity-card";
import ChatMediaMessage from "@/features/chat/components/chat-media-message";

const fmtTime = (d: Date) =>
  new Date(d).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const STATUS_ICON: Record<string, string> = {
  sending: "clock-outline",
  sent: "check",
  delivered: "check-all",
  read: "check-all",
  failed: "alert-circle-outline",
};

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const retryMessage = useChatStore((state) => state.retryMessage);
  const isOwn = message.senderId === currentUserId;
  const isFailed = message.status === "failed";
  // A linked RFQ/donation/etc. card or a photo/video already carries its
  // own rounded card styling — wrapping that in a second colored bubble
  // would frame it twice. Only the text (if any) gets the solid pill; rich
  // content sits directly on the thread background.
  const hasRichContent = !!message.linkedEntity || !!message.media;

  const bubbleColor = isOwn ? colors.primary : colors.backgroundSecondary;
  const textColor = isOwn ? "#fff" : colors.text;
  const metaColor = isOwn ? "rgba(255,255,255,0.75)" : colors.textSecondary;
  const readColor = isOwn ? "#fff" : colors.info;

  return (
    <Pressable
      onPress={isFailed ? () => retryMessage(message.conversationId, message.id) : undefined}
      className="flex-row px-2.5 my-[5px]"
      style={{ justifyContent: isOwn ? "flex-end" : "flex-start" }}
    >
      <View
        style={[
          { maxWidth: "80%" },
          message.status === "sending" && { opacity: 0.65 },
          hasRichContent
            ? [{ gap: 6 }, isFailed && { borderWidth: 1, borderColor: colors.error, borderRadius: 14, padding: 2 }]
            : [
                {
                  borderRadius: 18,
                  paddingHorizontal: 12,
                  paddingTop: 9,
                  paddingBottom: 6,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 3,
                  elevation: 1,
                },
                {
                  backgroundColor: bubbleColor,
                  borderTopRightRadius: isOwn ? 6 : 18,
                  borderTopLeftRadius: isOwn ? 18 : 6,
                  shadowColor: colors.text,
                },
                isFailed && { borderWidth: 1, borderColor: colors.error },
              ],
        ]}
      >
        {message.linkedEntity && (
          <View className="overflow-hidden rounded-[14px]">
            <LinkedEntityCard entity={message.linkedEntity} />
          </View>
        )}

        {message.media && (
          <View className="overflow-hidden rounded-[14px]">
            <ChatMediaMessage media={message.media} />
          </View>
        )}

        {message.text ? (
          <Text
            className={`text-[15.5px] leading-[21px]${hasRichContent ? " px-0.5" : ""}`}
            style={{ color: textColor }}
          >
            {message.text}
          </Text>
        ) : null}

        <View
          className="flex-row justify-end items-center mt-[3px] self-end"
          style={hasRichContent ? { paddingHorizontal: 2 } : undefined}
        >
          <Text className="text-[11px] font-medium" style={{ color: hasRichContent ? colors.textSecondary : metaColor }}>
            {fmtTime(message.createdAt)}
          </Text>
          {isOwn && (
            <MaterialCommunityIcons
              name={STATUS_ICON[message.status] as any}
              size={14}
              color={
                message.status === "read"
                  ? readColor
                  : message.status === "failed"
                    ? colors.error
                    : hasRichContent
                      ? colors.textSecondary
                      : metaColor
              }
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default MessageBubble;

