import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface InlineEmptyNoticeProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
  // Icon size varied slightly (22 vs 24) between the two screens this
  // was extracted from — preserved as an override rather than forced
  // to one value, since both are subtle enough that normalizing either
  // way is a judgment call, not an obvious fix.
  iconSize?: number;
}

// A visually distinct sibling of shared/components/empty-state.tsx:
// that one is for a full list's empty state (pt-20, size-36 icon).
// This one is for a smaller, dashed-border inline notice within an
// embedded list or section — e.g. "no rules set yet" inside a rules
// editor, "no matches" inside a facility search list. Different
// context, different (smaller, bordered) treatment, so a separate
// component rather than overloading EmptyState with a mode switch.
const InlineEmptyNotice: React.FC<InlineEmptyNoticeProps> = ({ icon, message, iconSize = 24 }) => {
  const { colors } = useTheme();

  return (
    <View
      className="border border-dashed rounded-lg p-4 items-center gap-1.5 justify-center"
      style={{ borderColor: colors.border }}
    >
      <MaterialCommunityIcons name={icon} size={iconSize} color={colors.textSecondary + "80"} />
      <Text className="text-xs text-center max-w-[85%]" style={{ color: colors.textSecondary }}>
        {message}
      </Text>
    </View>
  );
};

export default InlineEmptyNotice;
