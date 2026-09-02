import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, Platform} from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import { Post, Comment } from "@/features/posts/types/posts.types";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";

type Filter = "active" | "suspended" | "removed" | "all";

function deriveState(post: Post): "active" | "suspended" | "removed" {
  if (post.deletedAt) return "removed";
  if (post.status === "suspended") return "suspended";
  return "active";
}

export default function PostsModerationScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const posts = usePostsStore((state) => state.posts);
  const fetchPosts = usePostsStore((state) => state.fetchPosts);
  const fetchComments = usePostsStore((state) => state.fetchComments);
  const getComments = usePostsStore((state) => state.getComments);
  const suspendPost = usePostsStore((state) => state.suspendPost);
  const reinstatePost = usePostsStore((state) => state.reinstatePost);
  const removePost = usePostsStore((state) => state.removePost);
  const restorePost = usePostsStore((state) => state.restorePost);
  const suspendComment = usePostsStore((state) => state.suspendComment);
  const reinstateComment = usePostsStore((state) => state.reinstateComment);
  const removeComment = usePostsStore((state) => state.removeComment);
  const restoreComment = usePostsStore((state) => state.restoreComment);

  useEffect(() => {
    fetchPosts();
  }, []);

  const [filter, setFilter] = useState<Filter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedId),
    [posts, selectedId],
  );
  const comments = selectedId ? getComments(selectedId) : [];

  useEffect(() => {
    if (selectedId) fetchComments(selectedId);
  }, [selectedId]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const sorted = useMemo(
    () =>
      [...posts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [posts],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((p) => deriveState(p) === filter);
  }, [sorted, filter]);

  const countFor = (f: Filter) =>
    f === "all" ? posts.length : posts.filter((p) => deriveState(p) === f).length;

  const handleSuspendPost = async (post: Post) => {
    const ok = await confirm({
      title: "Suspend this post?",
      message:
        "It will be hidden from the community feed. The author can still see it, and you can reinstate it later.",
      confirmLabel: "Suspend",
    });
    if (!ok) return;
    const success = await suspendPost(post.id);
    toast[success ? "success" : "error"](
      success ? "Post suspended." : "Couldn't suspend the post.",
    );
  };

  const handleReinstatePost = async (post: Post) => {
    const success = await reinstatePost(post.id);
    toast[success ? "success" : "error"](
      success ? "Post reinstated." : "Couldn't reinstate the post.",
    );
  };

  const handleRemovePost = async (post: Post) => {
    const ok = await confirm({
      title: "Remove this post?",
      message:
        "This soft-removes it — it disappears from the feed but can still be restored later if needed.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    const success = await removePost(post.id);
    if (success) {
      toast.success("Post removed.");
      setSelectedId(null);
    } else {
      toast.error("Couldn't remove the post.");
    }
  };

  const handleRestorePost = async (post: Post) => {
    const success = await restorePost(post.id);
    toast[success ? "success" : "error"](
      success ? "Post restored." : "Couldn't restore the post.",
    );
  };

  const handleSuspendComment = async (comment: Comment) => {
    const success = await suspendComment(comment.postId, comment.id);
    toast[success ? "success" : "error"](
      success ? "Comment suspended." : "Couldn't suspend the comment.",
    );
  };

  const handleReinstateComment = async (comment: Comment) => {
    const success = await reinstateComment(comment.postId, comment.id);
    toast[success ? "success" : "error"](
      success ? "Comment reinstated." : "Couldn't reinstate the comment.",
    );
  };

  const handleRemoveComment = async (comment: Comment) => {
    const ok = await confirm({
      title: "Remove this comment?",
      message:
        "This soft-removes it — it disappears from the post but can still be restored later.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    const success = await removeComment(comment.postId, comment.id);
    toast[success ? "success" : "error"](
      success ? "Comment removed." : "Couldn't remove the comment.",
    );
  };

  const handleRestoreComment = async (comment: Comment) => {
    const success = await restoreComment(comment.postId, comment.id);
    toast[success ? "success" : "error"](
      success ? "Comment restored." : "Couldn't restore the comment.",
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        )}
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
          Post Moderation
        </Text>
      </View>

      <StatusFilterTabs
        options={[
          { key: "active", label: "Active", count: countFor("active") },
          { key: "suspended", label: "Suspended", count: countFor("suspended") },
          { key: "removed", label: "Removed", count: countFor("removed") },
          { key: "all", label: "All", count: countFor("all") },
        ]}
        selected={filter}
        onSelect={(key) => setFilter(key as Filter)}
      />

      <ScrollView contentContainerClassName="p-4 gap-2.5">
        {filtered.length === 0 ? (
          <EmptyState icon="forum-outline" message="No posts here." />
        ) : (
          filtered.map((post) => {
            const state = deriveState(post);
            return (
              <Pressable
                key={post.id}
                onPress={() => setSelectedId(post.id)}
                className="rounded-[14px] border p-3.5 gap-2"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="w-[34px] h-[34px] rounded-full items-center justify-center"
                    style={{ backgroundColor: post.author.avatarColor }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {post.author.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {post.author.name}
                    </Text>
                    <Text
                      className="text-[11px] mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      {format(post.createdAt)}
                    </Text>
                  </View>
                  {state !== "active" && <StateBadge colors={colors} state={state} />}
                </View>
                {post.text ? (
                  <Text
                    className="text-[13px] leading-[18px]"
                    style={{ color: colors.text }}
                    numberOfLines={3}
                  >
                    {post.text}
                  </Text>
                ) : null}
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {post.likeCount} likes · {post.commentCount} comments
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedId(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="rounded-t-[20px] p-5"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-3.5">
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Post Details
              </Text>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {selectedPost && (
              <ScrollView className="max-h-[75%]">
                <View className="flex-row items-center gap-2.5 mb-3">
                  <View
                    className="w-[34px] h-[34px] rounded-full items-center justify-center"
                    style={{ backgroundColor: selectedPost.author.avatarColor }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {selectedPost.author.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>
                      {selectedPost.author.name}
                    </Text>
                    <Text
                      className="text-[11px] mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      {format(selectedPost.createdAt)}
                    </Text>
                  </View>
                  <StateBadge colors={colors} state={deriveState(selectedPost)} />
                </View>

                {selectedPost.text ? (
                  <Text
                    className="text-sm leading-5 mb-4"
                    style={{ color: colors.text }}
                  >
                    {selectedPost.text}
                  </Text>
                ) : null}

                <View className="flex-row gap-2.5 mb-5">
                  {deriveState(selectedPost) === "removed" ? (
                    <ActionButton
                      label="Restore"
                      icon="restore"
                      tint={colors.primary}
                      onPress={() => handleRestorePost(selectedPost)}
                    />
                  ) : (
                    <>
                      {deriveState(selectedPost) === "suspended" ? (
                        <ActionButton
                          label="Reinstate"
                          icon="check-circle-outline"
                          tint={colors.success}
                          onPress={() => handleReinstatePost(selectedPost)}
                        />
                      ) : (
                        <ActionButton
                          label="Suspend"
                          icon="pause-circle-outline"
                          tint={colors.warning}
                          onPress={() => handleSuspendPost(selectedPost)}
                        />
                      )}
                      <ActionButton
                        label="Remove"
                        icon="trash-can-outline"
                        tint={colors.error}
                        onPress={() => handleRemovePost(selectedPost)}
                      />
                    </>
                  )}
                </View>

                <Text
                  className="text-[11px] font-bold tracking-wide uppercase mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Comments ({comments.length})
                </Text>

                {comments.length === 0 ? (
                  <Text
                    className="text-xs py-2"
                    style={{ color: colors.textSecondary }}
                  >
                    No comments yet.
                  </Text>
                ) : (
                  comments.map((comment) => {
                    const commentState = comment.deletedAt
                      ? "removed"
                      : comment.status === "suspended"
                        ? "suspended"
                        : "active";
                    return (
                      <View
                        key={comment.id}
                        className="flex-row gap-2.5 py-2.5 border-t"
                        style={{ borderTopColor: colors.border }}
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="text-xs font-bold"
                              style={{ color: colors.text }}
                            >
                              {comment.author.name}
                            </Text>
                            {commentState !== "active" && (
                              <StateBadge
                                colors={colors}
                                state={commentState}
                                compact
                              />
                            )}
                          </View>
                          <Text
                            className="text-[13px] leading-[18px] mt-0.5"
                            style={{ color: colors.text }}
                          >
                            {comment.text}
                          </Text>
                          <Text
                            className="text-[11px] mt-0.5"
                            style={{ color: colors.textSecondary }}
                          >
                            {format(comment.createdAt)}
                          </Text>
                        </View>
                        <View className="gap-1.5">
                          {commentState === "removed" ? (
                            <Pressable
                              onPress={() => handleRestoreComment(comment)}
                              hitSlop={6}
                            >
                              <MaterialCommunityIcons
                                name="restore"
                                size={18}
                                color={colors.primary}
                              />
                            </Pressable>
                          ) : (
                            <>
                              {commentState === "suspended" ? (
                                <Pressable
                                  onPress={() => handleReinstateComment(comment)}
                                  hitSlop={6}
                                >
                                  <MaterialCommunityIcons
                                    name="check-circle-outline"
                                    size={18}
                                    color={colors.success}
                                  />
                                </Pressable>
                              ) : (
                                <Pressable
                                  onPress={() => handleSuspendComment(comment)}
                                  hitSlop={6}
                                >
                                  <MaterialCommunityIcons
                                    name="pause-circle-outline"
                                    size={18}
                                    color={colors.warning}
                                  />
                                </Pressable>
                              )}
                              <Pressable
                                onPress={() => handleRemoveComment(comment)}
                                hitSlop={6}
                              >
                                <MaterialCommunityIcons
                                  name="trash-can-outline"
                                  size={18}
                                  color={colors.error}
                                />
                              </Pressable>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StateBadge({
  colors,
  state,
  compact,
}: {
  colors: any;
  state: "active" | "suspended" | "removed";
  compact?: boolean;
}) {
  const color =
    state === "removed"
      ? colors.error
      : state === "suspended"
        ? colors.warning
        : colors.success;
  const label =
    state === "removed" ? "Removed" : state === "suspended" ? "Suspended" : "Active";

  return (
    <View
      className={`px-2 rounded-lg ${compact ? "py-0.5" : "py-1"}`}
      style={{ backgroundColor: color + "18" }}
    >
      <Text
        className={`font-bold ${compact ? "text-[9px]" : "text-[10px]"}`}
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  tint,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
      style={{ backgroundColor: tint + "18" }}
    >
      <MaterialCommunityIcons name={icon} size={15} color={tint} />
      <Text className="text-[13px] font-bold" style={{ color: tint }}>
        {label}
      </Text>
    </Pressable>
  );
}