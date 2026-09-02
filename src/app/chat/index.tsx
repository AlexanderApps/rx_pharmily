import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator, StyleSheet, Platform} from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BsFlatList } from "@/shared/components/bs/bs-primitives";
import ChatListItem from "@/features/chat/components/chat-list-item";
import ChatListSkeleton from "@/features/chat/components/chat-list-skeleton";
import { useChatStore, UserSearchResult } from "@/features/chat/hooks/use-chat-data";

export default function ChatListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const conversations = useChatStore((state) => state.conversations);
  const messagesByConversation = useChatStore(
    (state) => state.messagesByConversation,
  );
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const userResults = useChatStore((state) => state.userResults);
  const searchUsers = useChatStore((state) => state.searchUsers);
  const startConversation = useChatStore((state) => state.startConversation);
  const markConversationRead = useChatStore(
    (state) => state.markConversationRead,
  );

  const newChatSheetRef = useRef<BottomSheetModal>(null);
  const [userSearch, setUserSearch] = useState("");
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  // isLoading starts false (the store's initial state) and only flips to
  // true once fetchConversations() actually begins — which itself has an
  // async gap before that happens. Gating the skeleton on isLoading alone
  // meant a fresh mount briefly rendered the FlatList's "No conversations
  // yet" empty state before the fetch had even started, then flipped to
  // the skeleton, then to the real result. This local flag starts false
  // and only becomes true once the very first fetch attempt has actually
  // finished, so the screen goes straight from mount to loading to its
  // final state.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    fetchConversations().finally(() => setHasLoadedOnce(true));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(handle);
  }, [userSearch]);

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      ),
    [conversations],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  const openThread = (conversationId: string) => {
    markConversationRead(conversationId);
    router.push({ pathname: "/chat/thread", params: { id: conversationId } });
  };

  const handleStartChat = async (user: UserSearchResult) => {
    if (startingChatWith) return;
    setStartingChatWith(user.id);
    const conversationId = await startConversation({
      id: user.id,
      name: user.name,
      facility: user.facility,
      avatarColor: user.avatarColor,
    });
    setStartingChatWith(null);
    if (!conversationId) return;
    newChatSheetRef.current?.dismiss();
    openThread(conversationId);
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View
        className="flex-row items-center justify-between px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center gap-3 flex-1">
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          )}
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>Chats</Text>
            <Text className="text-xs mt-[3px]" style={{ color: colors.textSecondary }}>
              {totalUnread > 0
                ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`
                : "You're all caught up"}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setUserSearch("");
            newChatSheetRef.current?.present();
          }}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <MaterialCommunityIcons name="pencil-plus-outline" size={18} color="#fff" />
        </Pressable>
      </View>

      {!hasLoadedOnce ? (
        <ChatListSkeleton />
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            contentContainerStyle={
              sorted.length === 0 ? { flexGrow: 1 } : undefined
            }
            ItemSeparatorComponent={() => (
              <View
                style={{ height: StyleSheet.hairlineWidth, marginLeft: 74, backgroundColor: colors.border }}
              />
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center gap-2.5 px-10 pt-20">
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text className="text-[13px] text-center" style={{ color: colors.textSecondary }}>
                  No conversations yet. Start one with the pencil icon above.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const messages = messagesByConversation[item.id] ?? [];
              return (
                <ChatListItem
                  conversation={item}
                  lastMessage={messages[messages.length - 1]}
                  onPress={() => openThread(item.id)}
                />
              );
            }}
          />
        </Animated.View>
      )}

      <BottomSheet
        ref={newChatSheetRef}
        snapPoints={["55%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        backgroundColor={colors.backgroundSecondary}
      >
        <View
          className="px-5 pb-3"
          style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
        >
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Start a new chat
          </Text>
        </View>
        <View className="px-4 pt-3 pb-1">
          <View
            className="flex-row items-center gap-2 rounded-[10px] px-3 py-[9px]"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
            <TextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search by name..."
              placeholderTextColor={colors.textSecondary}
              className="flex-1 text-[13px] p-0"
              style={{ color: colors.text }}
            />
          </View>
        </View>
        <BsFlatList
          style={{ flex: 1 }}
          data={userResults}
          ListEmptyComponent={
            userSearch.trim().length > 0 ? (
              <Text className="text-[13px] text-center" style={{ color: colors.textSecondary }}>
                No users found.
              </Text>
            ) : (
              <Text className="text-[13px] text-center" style={{ color: colors.textSecondary }}>
                Search for someone by name to start a chat.
              </Text>
            )
          }
          keyExtractor={(p: UserSearchResult) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }: { item: UserSearchResult }) => (
            <Pressable
              onPress={() => handleStartChat(item)}
              disabled={!!startingChatWith}
              className="flex-row items-center gap-3 py-2.5 px-1 rounded-[10px]"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.backgroundElement : "transparent",
                opacity: startingChatWith && startingChatWith !== item.id ? 0.4 : 1,
              })}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: item.avatarColor }}
              >
                <Text className="text-white text-[13px] font-bold">
                  {item.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {item.name}
                </Text>
                <Text className="text-xs mt-px" style={{ color: colors.textSecondary }}>
                  {item.facility}
                </Text>
              </View>
              {startingChatWith === item.id && (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              )}
            </Pressable>
          )}
        />
      </BottomSheet>
    </View>
  );
}
