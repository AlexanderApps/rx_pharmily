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
      className="rounded-[14px] border p-3.5 gap-2.5"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2.5">
        <ClickableAvatar
          entityType="user"
          entityId={post.author.id}
          name={post.author.name}
          avatarColor={post.author.avatarColor}
          subtitle={post.author.role}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {post.author.name}
          </Text>
          {post.author.role ? (
            <Text
              className="text-[11px] mt-px"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {post.author.role}
            </Text>
          ) : null}
          <Text className="text-[11px] mt-px" style={{ color: colors.textSecondary }}>
            {format(post.createdAt)}
          </Text>
        </View>
      </View>

      {post.text ? (
        <Text className="text-sm leading-5" style={{ color: colors.text }}>{post.text}</Text>
      ) : null}

      {post.media && post.media.length > 0 && <MediaCarousel media={post.media} />}

      {post.type === "poll" && post.poll && (
        <PollView postId={post.id} poll={post.poll} />
      )}

      {post.type === "news" && post.news && <NewsView news={post.news} />}

      <View className="flex-row gap-5 pt-2.5" style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <Pressable
          onPress={() => toggleLike(post.id)}
          className="flex-row items-center gap-1.5"
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={post.hasLiked ? "heart" : "heart-outline"}
            size={18}
            color={post.hasLiked ? colors.error : colors.textSecondary}
          />
          <Text
            className="text-[13px] font-medium"
            style={{ color: post.hasLiked ? colors.error : colors.textSecondary }}
          >
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onPress?.(post)}
          className="flex-row items-center gap-1.5"
          hitSlop={6}
        >
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color={colors.textSecondary}
          />
          <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
            {post.commentCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default PostCard;

