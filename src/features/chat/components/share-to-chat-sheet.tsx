import React, { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import BottomSheet from "@/shared/components/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { useChatStore, UserSearchResult } from "@/features/chat/hooks/use-chat-data";
import { ChatLinkedEntity } from "@/features/chat/types/chat.types";

export interface ShareToChatSheetRef {
  present: () => void;
}

interface ShareToChatSheetProps {
  // The item currently being shared — set once by the caller, sent as
  // the message's linked entity regardless of which conversation the
  // person picks below.
  entity: ChatLinkedEntity;
}

// A single ref-based sheet, mounted once per detail screen and given
// the current item at render time — the screen just calls
// shareSheetRef.current?.present() from a Share action, this handles
// the rest (picking who to send it to, actually sending it).
const ShareToChatSheet = forwardRef<ShareToChatSheetRef, ShareToChatSheetProps>(
  ({ entity }, ref) => {
    const { colors } = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [query, setQuery] = useState("");
    const [sendingId, setSendingId] = useState<string | null>(null);

    const conversations = useChatStore((state) => state.conversations);
    const userResults = useChatStore((state) => state.userResults);
    const isLoading = useChatStore((state) => state.isLoading);
    const searchUsers = useChatStore((state) => state.searchUsers);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const startConversation = useChatStore((state) => state.startConversation);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    useEffect(() => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const handle = setTimeout(() => searchUsers(trimmed), 300);
      return () => clearTimeout(handle);
    }, [query]);

    const matchingConversations = useMemo(() => {
      const q = query.trim().toLowerCase();
      return conversations.filter((c) => c.participant.name.toLowerCase().includes(q) || !q);
    }, [conversations, query]);

    // A person already in an existing conversation shouldn't also show
    // up in "new" search results below — that'd offer two different
    // ways to reach the same conversation.
    const existingParticipantIds = useMemo(
      () => new Set(conversations.map((c) => c.participant.id)),
      [conversations],
    );
    const newUserResults = useMemo(
      () => userResults.filter((u) => !existingParticipantIds.has(u.id)),
      [userResults, existingParticipantIds],
    );

    const handleShareToConversation = async (conversationId: string) => {
      setSendingId(conversationId);
      await sendMessage(conversationId, { linkedEntity: entity });
      setSendingId(null);
      sheetRef.current?.dismiss();
      toast.success("Shared.");
      router.push({ pathname: "/chat/thread", params: { id: conversationId } });
    };

    const handleShareToNewUser = async (user: UserSearchResult) => {
      setSendingId(user.id);
      const conversationId = await startConversation(
        { id: user.id, name: user.name, facility: user.facility, avatarColor: user.avatarColor },
        entity,
      );
      setSendingId(null);
      if (!conversationId) {
        toast.error("Couldn't start that conversation.");
        return;
      }
      sheetRef.current?.dismiss();
      toast.success("Shared.");
      router.push({ pathname: "/chat/thread", params: { id: conversationId } });
    };

    return (
      <BottomSheet ref={sheetRef} title="Share to chat" snapPoints={["70%"]} enableDynamicSizing={false}>
        <View className="px-4 pb-4 gap-3" style={{ flex: 1 }}>
          <View
            className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people or conversations"
              placeholderTextColor={colors.textSecondary}
              className="flex-1 text-sm"
              style={{ color: colors.text }}
            />
          </View>

          <FlatList
            data={matchingConversations}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ gap: 6 }}
            ListHeaderComponent={
              matchingConversations.length > 0 ? (
                <Text className="text-[11px] font-bold uppercase mb-1" style={{ color: colors.textSecondary }}>
                  Conversations
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleShareToConversation(item.id)}
                disabled={sendingId === item.id}
                className="flex-row items-center gap-3 py-2.5 px-1.5 rounded-xl active:opacity-70"
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <MaterialCommunityIcons
                    name={item.participant.kind === "facility" ? "domain" : "account"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                  {item.participant.name}
                </Text>
                {sendingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <MaterialCommunityIcons name="send-outline" size={18} color={colors.primary} />
                )}
              </Pressable>
            )}
            ListFooterComponent={
              <>
                {query.trim().length > 0 && (
                  <>
                    <Text className="text-[11px] font-bold uppercase mt-3 mb-1" style={{ color: colors.textSecondary }}>
                      People
                    </Text>
                    {isLoading && <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginTop: 8 }} />}
                    {newUserResults.map((user) => (
                      <Pressable
                        key={user.id}
                        onPress={() => handleShareToNewUser(user)}
                        disabled={sendingId === user.id}
                        className="flex-row items-center gap-3 py-2.5 px-1.5 rounded-xl active:opacity-70"
                      >
                        <View
                          className="w-11 h-11 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.backgroundElement }}
                        >
                          <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                            {user.name}
                          </Text>
                          {user.facility && (
                            <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                              {user.facility}
                            </Text>
                          )}
                        </View>
                        {sendingId === user.id ? (
                          <ActivityIndicator size="small" color={colors.textSecondary} />
                        ) : (
                          <MaterialCommunityIcons name="send-outline" size={18} color={colors.primary} />
                        )}
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            }
            ListEmptyComponent={
              query.trim().length === 0 ? (
                <Text className="text-sm text-center mt-6" style={{ color: colors.textSecondary }}>
                  Search for someone to share this with.
                </Text>
              ) : null
            }
          />
        </View>
      </BottomSheet>
    );
  },
);

export default ShareToChatSheet;
