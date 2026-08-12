import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
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
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Post</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={{ marginBottom: 8 }}>
              <PostCard post={post} />
              <Text style={[styles.commentsHeading, { color: colors.textSecondary }]}>
                Comments ({comments.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No comments yet — be the first to reply.
            </Text>
          }
          renderItem={({ item }) => <CommentRow comment={item} />}
        />

        <View style={[styles.composer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: currentUser.avatarColor }]}>
            <Text style={styles.avatarText}>
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
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            multiline
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: commentText.trim()
                  ? colors.primary
                  : colors.backgroundElement,
              },
            ]}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  listContent: { padding: 16, flexGrow: 1 },
  commentsHeading: { fontSize: 12, fontWeight: "600", marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 24 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
