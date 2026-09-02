import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import PostCard from "@/features/posts/components/post-card";
import CommentRow from "@/features/posts/components/comment-row";

export default function PostDetailsScreen() {
  const { colors } = useTheme();
  const currentUser = useProfileStore((state) => state.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const posts = usePostsStore((state) => state.posts);
  const isLoadingPosts = usePostsStore((state) => state.isLoading);
  const commentsByPost = usePostsStore((state) => state.commentsByPost);
  const addComment = usePostsStore((state) => state.addComment);
  const fetchComments = usePostsStore((state) => state.fetchComments);

  useEffect(() => {
    if (id) fetchComments(id);
  }, [id]);

  const listRef = useRef<FlatList>(null);
  const [commentText, setCommentText] = useState("");

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);
  const comments = useMemo(
    () => (id ? commentsByPost[id] ?? [] : []),
    [commentsByPost, id],
  );

  if (!post) {
    if (isLoadingPosts) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No post found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Header Section */}
      <ScreenHeader title="Post" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="mb-2">
              <PostCard post={post} />
              <Text className="text-xs font-semibold mt-4 mb-1" style={{ color: colors.textSecondary }}>
                Comments ({comments.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="text-[13px] text-center mt-6" style={{ color: colors.textSecondary }}>
              No comments yet — be the first to reply.
            </Text>
          }
          renderItem={({ item }) => <CommentRow comment={item} />}
        />

        {/* Input Message Composer Banner Footer */}
        <View 
          className="flex-row items-end gap-2 px-3 pt-2 pb-2.5 border-t" 
          style={{ backgroundColor: colors.background, borderTopColor: colors.border }}
        >
          {/* User Profile Initial Badge */}
          <View 
            className="w-8 h-8 rounded-full items-center justify-center" 
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            <Text className="text-white text-[11px] font-bold">
              {currentUser.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </Text>
          </View>
          
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 min-h-[36px] max-h-[100px] rounded-full px-3.5 py-2 text-sm"
            style={{ backgroundColor: colors.backgroundElement, color: colors.text }}
            multiline
          />
          
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: commentText.trim()
                ? colors.primary
                : colors.backgroundElement,
            }}
          >
            <MaterialCommunityIcons
              name="send"
              size={16}
              color={commentText.trim() ? "#fff" : colors.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
