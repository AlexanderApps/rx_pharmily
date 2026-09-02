import React from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface HorizontalScrollContainerProps {
  title: string;
  onViewAllPress?: () => void;
  viewAllText?: string;
  textColor: string;
  children: React.ReactNode;
}

export const HorizontalScrollContainer = ({
  title,
  onViewAllPress,
  viewAllText = "View All",
  textColor,
  children,
}: HorizontalScrollContainerProps) => {
  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <Text className="text-lg font-semibold" style={{ color: textColor }}>
          {title}
        </Text>
        {onViewAllPress && (
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5"
      >
        {children}
      </ScrollView>
    </View>
  );
};