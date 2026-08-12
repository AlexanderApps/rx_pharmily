import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const conversations = useChatStore((state) => state.conversations);
  const isLoading = useChatStore((state) => state.isLoading);
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

  useEffect(() => {
    fetchConversations();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeftGroup}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Chats</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="pencil-plus-outline" size={18} color="#fff" />
        </Pressable>
      </View>

      {isLoading && conversations.length === 0 ? (
        <ChatListSkeleton />
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            contentContainerStyle={
              sorted.length === 0 ? styles.emptyContent : undefined
            }
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Start a new chat
          </Text>
        </View>
        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
            <TextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search by name..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>
        <BsFlatList
          style={{ flex: 1 }}
          data={userResults}
          ListEmptyComponent={
            userSearch.trim().length > 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users found.
              </Text>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
              style={({ pressed }) => [
                styles.participantRow,
                {
                  backgroundColor: pressed ? colors.backgroundElement : "transparent",
                  opacity: startingChatWith && startingChatWith !== item.id ? 0.4 : 1,
                },
              ]}
            >
              <View
                style={[styles.avatar, { backgroundColor: item.avatarColor }]}
              >
                <Text style={styles.avatarText}>
                  {item.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.participantName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.participantFacility,
                    { color: colors.textSecondary },
                  ]}
                >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeftGroup: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  backButton: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 3 },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  emptyContent: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyText: { fontSize: 13, textAlign: "center" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  participantName: { fontSize: 14, fontWeight: "600" },
  participantFacility: { fontSize: 12, marginTop: 1 },
});
