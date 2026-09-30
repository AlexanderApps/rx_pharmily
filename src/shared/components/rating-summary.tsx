import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAppSettingsStore } from "@/features/app-settings/hooks/use-app-settings";

interface RatingSummaryProps {
  avgRating: number;
  ratingCount: number;
  size?: "small" | "medium";
  // Shown when ratingCount is 0 — omit to render nothing in that case
  // (e.g. a compact card where "No ratings yet" would be clutter).
  emptyLabel?: string;
}

// Read-only display — for the star picker used to actually submit a
// rating, see rating-submit-sheet.tsx.
const RatingSummary: React.FC<RatingSummaryProps> = ({ avgRating, ratingCount, size = "medium", emptyLabel }) => {
  const { colors } = useTheme();
  const showRatings = useAppSettingsStore((state) => state.showRatings);
  if (!showRatings) return null;

  if (ratingCount === 0) {
    if (!emptyLabel) return null;
    return (
      <Text className={size === "small" ? "text-[11px]" : "text-xs"} style={{ color: colors.textSecondary }}>
        {emptyLabel}
      </Text>
    );
  }

  const starSize = size === "small" ? 13 : 15;
  const textClass = size === "small" ? "text-[11px]" : "text-xs";

  return (
    <View className="flex-row items-center gap-1">
      <MaterialCommunityIcons name="star" size={starSize} color={colors.warning} />
      <Text className={`${textClass} font-bold`} style={{ color: colors.text }}>
        {avgRating.toFixed(1)}
      </Text>
      <Text className={textClass} style={{ color: colors.textSecondary }}>
        ({ratingCount})
      </Text>
    </View>
  );
};

export default React.memo(RatingSummary);
