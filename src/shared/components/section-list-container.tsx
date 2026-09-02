import React from "react";
import { Text, View, Pressable } from "react-native";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface SectionListContainerProps {
  title: string;
  onViewAllPress?: () => void;
  viewAllText?: string;
  backgroundColor: string;
  children: React.ReactElement | React.ReactNode;
  textColor: string;
}

export const SectionListContainer = ({
  title,
  onViewAllPress,
  viewAllText = "View All",
  backgroundColor,
  textColor,
  children,
}: SectionListContainerProps) => {
  return (
    <View className="px-5 mt-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>{title}</Text>
        {onViewAllPress && (
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

      <View className="rounded-3xl overflow-hidden" style={{ backgroundColor }}>{children}</View>
    </View>
  );
};

