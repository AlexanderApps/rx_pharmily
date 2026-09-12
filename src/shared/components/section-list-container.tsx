import React from "react";
import { Text, View, Pressable } from "react-native";
import { noSelectStyle } from "@/shared/constants/text-selection";
import { useTheme } from "@/shared/hooks/use-theme";

interface SectionListContainerProps {
  title: string;
  onViewAllPress?: () => void;
  viewAllText?: string;
  backgroundColor: string;
  children: React.ReactElement | React.ReactNode;
  textColor: string;
  // Shown in place of children when there's nothing to list — appropriate
  // for a section of the person's own content (e.g. "My Active RxRFQs"),
  // where "nothing here yet" is itself useful context. If omitted, the
  // whole section — header, "View All" link, and all — renders nothing
  // when empty, rather than a title dangling over a blank card. That's
  // the right default for discovery/marketplace sections (e.g. "Nearby
  // Requests"), where there's nothing actionable to say about an empty
  // result set.
  emptyMessage?: string;
}

export const SectionListContainer = ({
  title,
  onViewAllPress,
  viewAllText = "View All",
  backgroundColor,
  textColor,
  children,
  emptyMessage,
}: SectionListContainerProps) => {
  const { colors } = useTheme();
  const isEmpty = React.Children.count(children) === 0;
  if (isEmpty && !emptyMessage) return null;

  return (
    <View className="px-5 mt-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>{title}</Text>
        {onViewAllPress && !isEmpty && (
          <Pressable
            onPress={onViewAllPress}
            // 1. Catches inaccurate tap targets outside the visual box
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            // 2. Active opacity dim feedback on user press — static
            // className rather than the function-form style prop, which
            // intermittently failed to actually commit on Android
            // elsewhere in this app (see poll-view.tsx's fix earlier
            // this session).
            className="py-1.5 px-2.5 items-center justify-center active:opacity-60 cursor-pointer hover:opacity-80"
          >
            <Text className="text-sm font-semibold text-[#16a34a]" style={noSelectStyle}>
              {viewAllText}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="rounded-3xl overflow-hidden" style={{ backgroundColor }}>
        {isEmpty ? (
          <View className="items-center justify-center py-8 px-5">
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>{emptyMessage}</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

