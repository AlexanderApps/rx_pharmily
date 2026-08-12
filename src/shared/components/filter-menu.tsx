import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";

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
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 52,
  },

  contentContainer: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
});
