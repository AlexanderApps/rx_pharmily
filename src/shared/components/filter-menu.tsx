import React from "react";
import { View, ScrollView, ViewStyle, StyleProp } from "react-native";

interface FilterMenuProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsHorizontalScrollIndicator?: boolean;
}

export default function FilterMenu({
  children,
  style,
  contentContainerStyle,
  showsHorizontalScrollIndicator = false,
}: FilterMenuProps) {
  return (
    <View className="w-full h-[52px]" style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        contentContainerStyle={[{ gap: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

