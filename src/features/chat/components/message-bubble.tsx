import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";
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
  const hasRichContent = !!message.linkedEntity || !!message.media;

  const bubbleColor = isOwn ? colors.primary : colors.backgroundSecondary;
  const textColor = isOwn ? "#fff" : colors.text;
  const metaColor = isOwn ? "rgba(255,255,255,0.75)" : colors.textSecondary;
  const readColor = isOwn ? "#fff" : colors.info;

  // ─────────────────────────────────────────────
  // Context menu actions
  // ─────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!message.text) return;
    await Clipboard.setStringAsync(message.text);
    // Optional toast / feedback
  }, [message.text]);

  const showContextMenu = useCallback(() => {
    const options = ["Copy"];
    // Add more later: "Reply", "Forward", "Delete", etc.
    if (isOwn && message.status !== "sending") {
      // options.push("Delete");
    }
    options.push("Cancel");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          // destructiveButtonIndex: options.indexOf("Delete"), // if you add Delete
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleCopy();
          // if (buttonIndex === 1) handleDelete();
        }
      );
    } else {
      // Android + Web fallback
      Alert.alert("Message", undefined, [
        { text: "Copy", onPress: handleCopy },
        // { text: "Delete", style: "destructive", onPress: handleDelete },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [handleCopy, isOwn, message.status]);

  // Web right-click handler
  const handleContextMenu = useCallback(
    (e: any) => {
      e?.preventDefault?.(); // stop browser default menu
      showContextMenu();
    },
    [showContextMenu]
  );

  return (
    <Pressable
      onPress={isFailed ? () => retryMessage(message.conversationId, message.id) : undefined}
      onLongPress={showContextMenu}
      // @ts-ignore – onContextMenu is supported by react-native-web
      onContextMenu={Platform.OS === "web" ? handleContextMenu : undefined}
      delayLongPress={400}
      className="flex-row px-2.5 my-[5px]"
      style={{ justifyContent: isOwn ? "flex-end" : "flex-start" }}
    >
      <View
        style={[
          { maxWidth: "80%" },
          message.status === "sending" && { opacity: 0.65 },
          hasRichContent
            ? [
                { gap: 6 },
                isFailed && {
                  borderWidth: 1,
                  borderColor: colors.error,
                  borderRadius: 14,
                  padding: 2,
                },
              ]
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
            selectable={false} // prevent system text selection competing with long-press
          >
            {message.text}
          </Text>
        ) : null}

        <View
          className="flex-row justify-end items-center mt-[3px] self-end"
          style={hasRichContent ? { paddingHorizontal: 2 } : undefined}
        >
          <Text
            className="text-[11px] font-medium"
            style={{ color: hasRichContent ? colors.textSecondary : metaColor }}
          >
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