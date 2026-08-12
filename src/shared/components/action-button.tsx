import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  // Tints the icon's background chip to match its color — the same
  // tinted-chip pattern used by cards throughout the app (RxRFQ, Donation,
  // MediScope cards, etc.) instead of a flat neutral box. Optional so
  // existing call sites that don't pass it keep the old neutral look.
  tintColor?: string;
  iconColor?: string;
  onPress?: () => void;
  colors: any;
}

export default function ActionButton({
  icon,
  label,
  tintColor,
  onPress,
  colors,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
        pressed && styles.actionPressed,
      ]}
    >
      <View
        style={[
          styles.actionIconWrapper,
          { backgroundColor: tintColor ? tintColor + "18" : colors.backgroundElement },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[styles.actionLabel, { color: colors.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: "31%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});
