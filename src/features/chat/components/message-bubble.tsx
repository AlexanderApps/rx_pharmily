import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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
      style={[styles.row, { justifyContent: isOwn ? "flex-end" : "flex-start" }]}
    >
      <View
        style={[
          styles.bubble,
          message.status === "sending" && styles.sendingBubble,
          hasRichContent
            ? [styles.richBubble, isFailed && { borderWidth: 1, borderColor: colors.error, borderRadius: 14, padding: 2 }]
            : [
                styles.textBubble,
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
          <View style={styles.section}>
            <LinkedEntityCard entity={message.linkedEntity} />
          </View>
        )}

        {message.media && (
          <View style={styles.section}>
            <ChatMediaMessage media={message.media} />
          </View>
        )}

        {message.text ? (
          <Text style={[styles.text, { color: textColor }, hasRichContent && styles.textAfterCard]}>
            {message.text}
          </Text>
        ) : null}

        <View
          style={[
            styles.metaRow,
            hasRichContent && { paddingHorizontal: 2 },
          ]}
        >
          <Text style={[styles.time, { color: hasRichContent ? colors.textSecondary : metaColor }]}>
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
              style={styles.statusIcon}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  bubble: { maxWidth: "80%" },
  sendingBubble: { opacity: 0.65 },
  richBubble: { gap: 6 },
  textBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  section: {
    overflow: "hidden",
    borderRadius: 14,
  },
  text: {
    fontSize: 15.5,
    lineHeight: 21,
  },
  textAfterCard: { paddingHorizontal: 2 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 3,
    alignSelf: "flex-end",
  },
  time: {
    fontSize: 11,
    fontWeight: "500",
  },
  statusIcon: { marginLeft: 3 },
});
