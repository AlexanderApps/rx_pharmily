import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { ChatLinkedEntity, ChatMedia } from "@/features/chat/types/chat.types";

interface ChatComposerProps {
  stagedEntity?: ChatLinkedEntity | null;
  stagedMedia?: ChatMedia | null;
  uploadingMedia?: boolean;
  onAttachPress: () => void;
  onAttachMediaPress: () => void;
  onRemoveStagedEntity: () => void;
  onRemoveStagedMedia: () => void;
  onSend: (text: string) => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({
  stagedEntity,
  stagedMedia,
  uploadingMedia = false,
  onAttachPress,
  onAttachMediaPress,
  onRemoveStagedEntity,
  onRemoveStagedMedia,
  onSend,
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const canSend = text.trim().length > 0 || !!stagedEntity || !!stagedMedia;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.background, borderTopColor: colors.border },
      ]}
    >
      {stagedEntity && (
        <View
          style={[
            styles.stagedChip,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              (stagedEntity.type === "rfq"
                ? "file-document-outline"
                : "heart-search") as any
            }
            size={14}
            color={colors.primary}
          />
          <Text
            style={[styles.stagedText, { color: colors.text }]}
            numberOfLines={1}
          >
            {stagedEntity.code} — {stagedEntity.title}
          </Text>
          <Pressable onPress={onRemoveStagedEntity} hitSlop={8}>
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      )}

      {stagedMedia && (
        <View style={styles.stagedMediaWrap}>
          {stagedMedia.type === "image" ? (
            <LoadingImage source={{ uri: stagedMedia.uri }} style={styles.stagedMediaThumb} />
          ) : (
            <View
              style={[
                styles.stagedMediaThumb,
                styles.stagedVideoThumb,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.text} />
            </View>
          )}
          <Pressable
            onPress={onRemoveStagedMedia}
            style={[styles.removeMediaButton, { backgroundColor: colors.error }]}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={12} color="#fff" />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={onAttachPress}
          style={[styles.iconButton, { backgroundColor: colors.backgroundElement }]}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name="paperclip"
            size={19}
            color={colors.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={onAttachMediaPress}
          disabled={uploadingMedia}
          style={[styles.iconButton, { backgroundColor: colors.backgroundElement, opacity: uploadingMedia ? 0.6 : 1 }]}
          hitSlop={6}
        >
          {uploadingMedia ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <MaterialCommunityIcons
              name="camera-outline"
              size={19}
              color={colors.textSecondary}
            />
          )}
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { backgroundColor: colors.backgroundElement, color: colors.text },
          ]}
          multiline
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? colors.primary : colors.backgroundElement },
          ]}
        >
          <MaterialCommunityIcons
            name="send"
            size={17}
            color={canSend ? "#fff" : colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default ChatComposer;

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  stagedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stagedText: { flex: 1, fontSize: 12, fontWeight: "500" },
  stagedMediaWrap: { width: 64, height: 64 },
  stagedMediaThumb: { width: 64, height: 64, borderRadius: 10 },
  stagedVideoThumb: { alignItems: "center", justifyContent: "center" },
  removeMediaButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
