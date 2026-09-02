import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
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
      className="border-t px-2.5 pt-2 pb-2.5 gap-2"
      style={{ backgroundColor: colors.background, borderTopColor: colors.border }}
    >
      {stagedEntity && (
        <View
          className="flex-row items-center gap-1.5 border rounded-[10px] px-2.5 py-[7px]"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
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
            className="flex-1 text-xs font-medium"
            style={{ color: colors.text }}
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
        <View className="w-16 h-16">
          {stagedMedia.type === "image" ? (
            <LoadingImage source={{ uri: stagedMedia.uri }} style={{ width: 64, height: 64, borderRadius: 10 }} />
          ) : (
            <View
              className="w-16 h-16 rounded-[10px] items-center justify-center"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.text} />
            </View>
          )}
          <Pressable
            onPress={onRemoveStagedMedia}
            className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full items-center justify-center"
            style={{ backgroundColor: colors.error }}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={12} color="#fff" />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-end gap-2">
        <Pressable
          onPress={onAttachPress}
          className="w-[38px] h-[38px] rounded-full items-center justify-center"
          style={{ backgroundColor: colors.backgroundElement }}
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
          className="w-[38px] h-[38px] rounded-full items-center justify-center"
          style={{ backgroundColor: colors.backgroundElement, opacity: uploadingMedia ? 0.6 : 1 }}
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
          className="flex-1 min-h-[38px] max-h-[100px] rounded-[19px] px-3.5 py-2.5 text-sm"
          style={{ backgroundColor: colors.backgroundElement, color: colors.text }}
          multiline
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className="w-[38px] h-[38px] rounded-full items-center justify-center"
          style={{ backgroundColor: canSend ? colors.primary : colors.backgroundElement }}
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

