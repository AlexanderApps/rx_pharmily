import React from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import { noSelectStyle } from "@/shared/constants/text-selection";
import { useTheme } from "@/shared/hooks/use-theme";

interface HorizontalScrollContainerProps {
  title: string;
  onViewAllPress?: () => void;
  viewAllText?: string;
  textColor: string;
  children: React.ReactNode;
  // See SectionListContainer's own comment for the full reasoning —
  // same behavior here: omitted means the whole section (header
  // included) renders nothing when there's no data, which is the right
  // default for a discovery section like "Nearby Requests" where an
  // empty result has nothing useful to say.
  emptyMessage?: string;
}

export const HorizontalScrollContainer = ({
  title,
  onViewAllPress,
  viewAllText = "View All",
  textColor,
  children,
  emptyMessage,
}: HorizontalScrollContainerProps) => {
  const { colors } = useTheme();
  const isEmpty = React.Children.count(children) === 0;
  if (isEmpty && !emptyMessage) return null;

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>
          {title}
        </Text>
        {onViewAllPress && !isEmpty && (
          <Pressable
            onPress={onViewAllPress}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            className="items-center justify-center px-2.5 py-1.5 active:opacity-60 cursor-pointer hover:opacity-80"
          >
            <Text className="text-sm font-semibold text-green-600" style={noSelectStyle}>
              {viewAllText}
            </Text>
          </Pressable>
        )}
      </View>

      {isEmpty ? (
        <View className="items-center justify-center py-6 px-5">
          <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5"
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};
