import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
}

// Consolidates the icon + centered-text empty-list pattern that was
// duplicated inline across 15 screens' ListEmptyComponent usages — same
// exact layout/sizing/color everywhere already (icon size 36, text-
// secondary color, gap-2.5, pt-20), just the icon and message differing
// per screen. A pure extraction, not a redesign — same reasoning as
// screen-header.tsx's own consolidation.
const EmptyState: React.FC<EmptyStateProps> = ({ icon, message }) => {
  const { colors } = useTheme();

  return (
    <View className="items-center justify-center gap-2.5 pt-20">
      <MaterialCommunityIcons name={icon} size={36} color={colors.textSecondary} />
      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
        {message}
      </Text>
    </View>
  );
};

export default EmptyState;
