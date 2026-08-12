import React from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

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
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        {onViewAllPress && (
          <Pressable
            onPress={onViewAllPress}
            // 1. Injected dynamic bounds checking parameters around the small text link
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            // 2. Added immediate response feedback when users hold the press target
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressedState,
            ]}
          >
            <Text style={styles.viewAllText}>{viewAllText}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAllButton: {
    paddingVertical: 6, // Expands physical height footprint safely
    paddingHorizontal: 10, // Expands physical width footprint safely
    alignItems: "center",
    justifyContent: "center",
  },
  pressedState: {
    opacity: 0.6, // Visual feedback anchor matching your design standards
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
  scrollView: {
    marginTop: 12,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
  },
});
