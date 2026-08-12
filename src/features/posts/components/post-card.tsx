import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { Post } from "@/features/posts/types/posts.types";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import PollView from "@/features/posts/components/poll-view";
import NewsView from "@/features/posts/components/news-view";
import MediaCarousel from "@/features/posts/components/media-carousel";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";

interface PostCardProps {
  post: Post;
  onPress?: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  const { colors } = useTheme();
  const toggleLike = usePostsStore((state) => state.toggleLike);

  return (
    <Pressable
      onPress={() => onPress?.(post)}
      style={[
        styles.card,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <ClickableAvatar
          entityType="user"
          entityId={post.author.id}
          name={post.author.name}
          avatarColor={post.author.avatarColor}
          subtitle={post.author.role}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
            {post.author.name}
          </Text>
          {post.author.role ? (
            <Text
              style={[styles.authorRole, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {post.author.role}
            </Text>
          ) : null}
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(post.createdAt)}
          </Text>
        </View>
      </View>

      {post.text ? (
        <Text style={[styles.text, { color: colors.text }]}>{post.text}</Text>
      ) : null}

      {post.media && post.media.length > 0 && <MediaCarousel media={post.media} />}

      {post.type === "poll" && post.poll && (
        <PollView postId={post.id} poll={post.poll} />
      )}

      {post.type === "news" && post.news && <NewsView news={post.news} />}

      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => toggleLike(post.id)}
          style={styles.actionButton}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={post.hasLiked ? "heart" : "heart-outline"}
            size={18}
            color={post.hasLiked ? colors.error : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: post.hasLiked ? colors.error : colors.textSecondary },
            ]}
          >
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onPress?.(post)}
          style={styles.actionButton}
          hitSlop={6}
        >
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.commentCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  authorName: { fontSize: 14, fontWeight: "600" },
  authorRole: { fontSize: 11, marginTop: 1 },
  timeAgo: { fontSize: 11, marginTop: 1 },
  text: { fontSize: 14, lineHeight: 20 },
  actionsRow: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "500" },
});
