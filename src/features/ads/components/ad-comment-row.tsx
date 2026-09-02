import React from "react";
import { View, Text } from "react-native";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { AdComment } from "@/features/ads/types/ads.types";

interface AdCommentRowProps {
  comment: AdComment;
}

const AdCommentRow: React.FC<AdCommentRowProps> = ({ comment }) => {
  const { colors } = useTheme();
  const initials = comment.author.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View className="flex-row gap-2.5 py-2">
      <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: comment.author.avatarColor }}>
        <Text className="text-white text-[11px] font-bold">{initials}</Text>
      </View>
      <View className="flex-1 rounded-xl p-2.5 gap-[3px]" style={{ backgroundColor: colors.backgroundElement }}>
        <View className="flex-row justify-between gap-2">
          <Text className="text-xs font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
            {comment.author.name}
          </Text>
          <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
            {format(comment.createdAt)}
          </Text>
        </View>
        <Text className="text-[13px] leading-[18px]" style={{ color: colors.text }}>{comment.text}</Text>
      </View>
    </View>
  );
};

export default AdCommentRow;

