import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

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
    <View style={styles.sectionPadding}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        {onViewAllPress && (
          <Pressable 
            onPress={onViewAllPress}
            // 1. Catches inaccurate tap targets outside the visual box
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }} 
            // 2. Active opacity dim feedback on user press
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressedState
            ]}
          >
            <Text style={styles.viewAllText}>
              {viewAllText}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.cardWrapper, { backgroundColor }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    // Removed marginBottom here so title aligns perfectly vertically with the action button text
  },
  viewAllButton: {
    paddingVertical: 6,   // Creates a taller physical footprint for thumb tracking
    paddingHorizontal: 10, // Creates a wider physical footprint for thumb tracking
    alignItems: "center",
    justifyContent: "center",
  },
  pressedState: {
    opacity: 0.6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
});
