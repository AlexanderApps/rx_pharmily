import React from "react";
import { View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import Skeleton from "@/shared/components/skeleton";

interface CommentSkeletonProps {
  rows?: number;
}

// Matches features/posts/components/comment-row.tsx and
// features/ads/components/ad-comment-row.tsx's shape exactly (both are
// structurally identical) — 32px avatar circle, then a bubble with a
// short name+time line on top and one or two wider text lines below,
// so there's no layout jump when the real comments arrive.
const CommentSkeleton: React.FC<CommentSkeletonProps> = ({ rows = 3 }) => {
  const { colors } = useTheme();
  return (
    <View className="gap-1">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="flex-row gap-2.5 py-2">
          <Skeleton width={32} height={32} borderRadius={16} />
          <View
            className="flex-1 rounded-xl p-2.5 gap-2"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <View className="flex-row justify-between gap-2">
              <Skeleton width="35%" height={11} borderRadius={5} />
              <Skeleton width={40} height={10} borderRadius={5} />
            </View>
            <Skeleton width={i % 2 === 0 ? "85%" : "60%"} height={12} borderRadius={5} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default CommentSkeleton;
