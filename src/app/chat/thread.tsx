import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BottomSheet from "@/shared/components/bottom-sheet";
import Animated, { FadeIn } from "react-native-reanimated";
import { uploadAppImage } from "@/lib/app-image-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === id),
  );
  const conversationsCount = useChatStore((state) => state.conversations.length);
  const isLoadingConversations = useChatStore((state) => state.isLoading);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const messages = useChatStore(
    (state) => (id ? state.messagesByConversation[id] : undefined) ?? EMPTY_MESSAGES,
  );
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const markConversationRead = useChatStore((state) => state.markConversationRead);

  const listRef = useRef<FlatList>(null);
  const linkSheetRef = useRef<LinkPickerSheetHandle>(null);
  const attachSheetRef = useRef<BottomSheetModal>(null);

  const [stagedEntity, setStagedEntity] = useState<ChatLinkedEntity | null>(null);
  const [stagedMedia, setStagedMedia] = useState<ChatMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Several entry points (a "Message" button on a profile card, an RFQ's
  // contact action) navigate straight here without ever visiting the chat
  // list screen — the only other place conversations gets fetched. Without
  // this, arriving that way on a fresh app launch leaves `conversations`
  // permanently empty, and this screen would sit on "no conversation
  // found" forever rather than ever resolving. hasAttemptedFetch guards
  // against retry-looping if the fetch fails and conversations stays
  // empty — this only ever fires once per mount, not on every render.
  const hasAttemptedFetch = useRef(false);
  useEffect(() => {
    if (conversationsCount === 0 && !isLoadingConversations && !hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      fetchConversations();
    }
  }, [conversationsCount, isLoadingConversations, fetchConversations]);

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
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
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
    // Distinguishes "conversations hasn't loaded yet" from "this id
    // genuinely doesn't match any conversation" — without this, a fresh
    // mount briefly renders "No conversation found" before conversations
    // has even had a chance to resolve, which then flips to the real
    // content a moment later. Showing the loading state here instead
    // means the screen goes straight from mount to loading to its final
    // state, with no flash of an incorrect "not found" in between.
    // Falls through to "not found" once a fetch attempt has actually
    // completed (rather than checking conversationsCount alone), so a
    // failed fetch resolves to an error state instead of an infinite
    // skeleton.
    if (isLoadingConversations || (conversationsCount === 0 && !hasAttemptedFetch.current)) {
      return (
        <View style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
          <ChatThreadSkeleton />
        </View>
      );
    }

    return (
      <View style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <Text className="p-4" style={{ color: colors.text }}>
          No conversation found for id: {id}
        </Text>
      </View>
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
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach a photo or video.",
      );
      return false;
    }
    return true;
  };

  const stageAsset = async (
    asset: ImagePicker.ImagePickerAsset,
    type: "image" | "video",
  ) => {
    const sizeBytes = asset.fileSize ?? 0;
    if (sizeBytes > MAX_CHAT_MEDIA_FILE_SIZE_BYTES) {
      Alert.alert(
        "File too large",
        "That file is over the 20MB limit — try a smaller one.",
      );
      return;
    }
    const fileName =
      asset.fileName ?? `chat-${Date.now()}.${type === "video" ? "mp4" : "jpg"}`;
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

  const handleAttachMediaPress = () => {
    attachSheetRef.current?.present();
  };

  return (
    <View
      style={[
        styles.flex1,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* Header */}
      <View
        className="flex-row items-center gap-2.5 px-3 py-2.5 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        )}
        <View
          className="w-[38px] h-[38px] items-center justify-center"
          style={
            conversation.participant.kind === "facility"
              ? { backgroundColor: colors.primary, borderRadius: 10 }
              : {
                  backgroundColor: conversation.participant.avatarColor,
                  borderRadius: 19,
                }
          }
        >
          {conversation.participant.kind === "facility" ? (
            <MaterialCommunityIcons name="office-building" size={18} color="#fff" />
          ) : (
            <Text className="text-white text-[13px] font-bold">{initials}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text
            className="text-[15px] font-bold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {conversation.participant.name}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textSecondary }}
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

      {/* Context banner */}
      {conversation.context && (
        <View
          className="px-4 py-2.5 border-b gap-1.5"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            className="text-[11px] font-semibold uppercase"
            style={{ color: colors.textSecondary }}
          >
            Conversation about
          </Text>
          <LinkedEntityCard entity={conversation.context} compact />
        </View>
      )}

      {(() => {
        const content = (
          <>
            {isLoadingMessages ? (
              <ChatThreadSkeleton />
            ) : (
              <Animated.View entering={FadeIn.duration(220)} style={styles.flex1}>
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
          </>
        );

        // KeyboardAvoidingView exists purely to make room for the on-screen
        // keyboard, which doesn't exist on web — and react-native-web's
        // implementation of it doesn't reliably behave as a flex container,
        // which is what left the composer sitting at content height instead
        // of stretching to fill the screen. A plain flex-1 View has no such
        // issue and needs no keyboard-avoidance behavior on web anyway.
        // className-based flex-1 was unreliable through this component
        // chain on both web and native, so this whole section uses
        // StyleSheet-based style props instead.
        if (Platform.OS === "web") {
          return <View style={styles.flex1}>{content}</View>;
        }

        return (
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          >
            {content}
          </KeyboardAvoidingView>
        );
      })()}

      <LinkPickerSheet ref={linkSheetRef} onSelect={handleSelectLink} />

      <BottomSheet
        ref={attachSheetRef}
        snapPoints={["25%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
      >
        <View className="px-5 py-2 gap-1">
          <Pressable
            onPress={() => {
              attachSheetRef.current?.dismiss();
              pickImage();
            }}
            className="flex-row items-center gap-3.5 py-3.5"
          >
            <MaterialCommunityIcons name="image-outline" size={20} color={colors.text} />
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
              Photo
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              attachSheetRef.current?.dismiss();
              pickVideo();
            }}
            className="flex-row items-center gap-3.5 py-3.5"
          >
            <MaterialCommunityIcons name="video-outline" size={20} color={colors.text} />
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
              Video
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

// StyleSheet, not className, for the layout-critical flex-1 chain
// (outer View -> KeyboardAvoidingView/View -> Animated.View -> FlatList)
// that makes the composer stick to the bottom of the screen. className-
// based flex-1 was unreliable through this component chain — particularly
// through KeyboardAvoidingView and Animated.View — on both web and native.
//
// The outer wrapper is a plain View with explicit useSafeAreaInsets()
// padding rather than SafeAreaView — on this screen, SafeAreaView's own
// inset application lagged a couple of frames behind the initial mount,
// visible as the header briefly rendering under the status bar before
// snapping into its correct position. useSafeAreaInsets() reads the same
// underlying measurement synchronously during render, with no extra
// internal effect/measurement step of its own to lag behind.
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  listContent: { paddingVertical: 12, flexGrow: 1 },
});