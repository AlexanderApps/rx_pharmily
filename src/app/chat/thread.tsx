import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BottomSheet from "@/shared/components/bottom-sheet";
import Animated, { FadeIn } from "react-native-reanimated";
import { uploadAppImage } from "@/lib/app-image-storage";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useChatStore } from "@/features/chat/hooks/use-chat-data";
import {
  ChatLinkedEntity,
  ChatMedia,
  ChatMessage,
  MAX_CHAT_MEDIA_FILE_SIZE_BYTES,
} from "@/features/chat/types/chat.types";
import MessageBubble from "@/features/chat/components/message-bubble";
import ChatThreadSkeleton from "@/features/chat/components/chat-thread-skeleton";
import LinkedEntityCard from "@/features/chat/components/linked-entity-card";
import ChatComposer from "@/features/chat/components/chat-composer";
import LinkPickerSheet, {
  LinkPickerSheetHandle,
} from "@/features/chat/components/link-picker-sheet";

// A fresh [] literal inside a Zustand selector is a real bug, not just
// style — React's useSyncExternalStore compares the selector's return
// value by reference, and "?? []" creates a brand new array every single
// call whenever there's no data yet. That reads as "the store changed"
// on every render, which re-renders, which calls the selector again,
// which returns another new (still conceptually empty) array — infinite
// loop. One stable reference for the empty case fixes it.
const EMPTY_MESSAGES: ChatMessage[] = [];

export default function ChatThreadScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === id),
  );
  const messages = useChatStore(
    (state) => (id ? state.messagesByConversation[id] : undefined) ?? EMPTY_MESSAGES,
  );
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markConversationRead = useChatStore(
    (state) => state.markConversationRead,
  );

  const listRef = useRef<FlatList>(null);
  const linkSheetRef = useRef<LinkPickerSheetHandle>(null);
  const [stagedEntity, setStagedEntity] = useState<ChatLinkedEntity | null>(
    null,
  );
  const [stagedMedia, setStagedMedia] = useState<ChatMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Only shows a skeleton if there's truly nothing to display yet — a
    // conversation the list screen already preloaded a few messages for
    // shows those immediately instead, while this fetch quietly resolves
    // the full history in the background and replaces them.
    setIsLoadingMessages(messages.length === 0);
    fetchMessages(id).finally(() => setIsLoadingMessages(false));
  }, [id]);

  useEffect(() => {
    if (id) markConversationRead(id);
  }, [id, markConversationRead]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, [messages.length]);

  const initials = useMemo(() => {
    if (!conversation) return "";
    return conversation.participant.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [conversation]);

  if (!conversation || !id) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ color: colors.text, padding: 16 }}>
          No conversation found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const handleSend = async (text: string) => {
    await sendMessage(id, {
      text,
      linkedEntity: stagedEntity ?? undefined,
      media: stagedMedia ?? undefined,
    });
    setStagedEntity(null);
    setStagedMedia(null);
  };

  const handleSelectLink = (entity: ChatLinkedEntity) => {
    setStagedEntity(entity);
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach a photo or video.");
      return false;
    }
    return true;
  };

  const stageAsset = async (asset: ImagePicker.ImagePickerAsset, type: "image" | "video") => {
    const sizeBytes = asset.fileSize ?? 0;
    if (sizeBytes > MAX_CHAT_MEDIA_FILE_SIZE_BYTES) {
      Alert.alert("File too large", "That file is over the 20MB limit — try a smaller one.");
      return;
    }
    const fileName = asset.fileName ?? `chat-${Date.now()}.${type === "video" ? "mp4" : "jpg"}`;
    setUploadingMedia(true);
    const uploadResult = await uploadAppImage(asset.uri, "chat", fileName);
    setUploadingMedia(false);

    if (!uploadResult.ok) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }

    setStagedEntity(null);
    setStagedMedia({
      type,
      uri: uploadResult.url,
      sizeBytes,
      width: asset.width,
      height: asset.height,
      durationMs: asset.duration ?? undefined,
    });
  };

  const pickImage = async () => {
    if (!(await requestMediaPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;
    await stageAsset(result.assets[0], "image");
  };

  const pickVideo = async () => {
    if (!(await requestMediaPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;
    await stageAsset(result.assets[0], "video");
  };

  const attachSheetRef = useRef<BottomSheetModal>(null);
  const handleAttachMediaPress = () => {
    attachSheetRef.current?.present();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.avatar,
            conversation.participant.kind === "facility"
              ? { backgroundColor: colors.primary, borderRadius: 10 }
              : { backgroundColor: conversation.participant.avatarColor },
          ]}
        >
          {conversation.participant.kind === "facility" ? (
            <MaterialCommunityIcons name="office-building" size={18} color="#fff" />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {conversation.participant.name}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {conversation.participant.kind === "facility"
              ? conversation.participant.memberCount > 0
                ? `${conversation.participant.memberCount} member${conversation.participant.memberCount === 1 ? "" : "s"}`
                : "Facility"
              : conversation.participant.facility}
          </Text>
        </View>
      </View>

      {conversation.context && (
        <View
          style={[
            styles.contextBanner,
            {
              backgroundColor: colors.backgroundSecondary,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.contextLabel, { color: colors.textSecondary }]}>
            Conversation about
          </Text>
          <LinkedEntityCard entity={conversation.context} compact />
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {isLoadingMessages ? (
          <ChatThreadSkeleton />
        ) : (
          <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => <MessageBubble message={item} />}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: false })
              }
            />
          </Animated.View>
        )}

        <ChatComposer
          stagedEntity={stagedEntity}
          stagedMedia={stagedMedia}
          uploadingMedia={uploadingMedia}
          onAttachPress={() => linkSheetRef.current?.open()}
          onAttachMediaPress={handleAttachMediaPress}
          onRemoveStagedEntity={() => setStagedEntity(null)}
          onRemoveStagedMedia={() => setStagedMedia(null)}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>

      <LinkPickerSheet
        ref={linkSheetRef}
        onSelect={handleSelectLink}
      />

      <BottomSheet ref={attachSheetRef} snapPoints={["25%"]} showHandle cornerRadius={20} padding={0} enablePanDownToClose>
        <View style={styles.attachOption}>
          <Pressable
            onPress={() => {
              attachSheetRef.current?.dismiss();
              pickImage();
            }}
            style={styles.attachRow}
          >
            <MaterialCommunityIcons name="image-outline" size={20} color={colors.text} />
            <Text style={[styles.attachRowText, { color: colors.text }]}>Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              attachSheetRef.current?.dismiss();
              pickVideo();
            }}
            style={styles.attachRow}
          >
            <MaterialCommunityIcons name="video-outline" size={20} color={colors.text} />
            <Text style={[styles.attachRowText, { color: colors.text }]}>Video</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  attachOption: { paddingHorizontal: 20, paddingVertical: 8, gap: 4 },
  attachRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  attachRowText: { fontSize: 15, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  back: { padding: 4 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  contextBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  contextLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  listContent: { paddingVertical: 12, flexGrow: 1 },
});
