// Reusable Components inside the module boundary

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ==========================================
// StatCard Component
// ==========================================
interface StatCardProps {
  number: string;
  label: string;
  type: "success" | "info" | "warning";
  colors: any;
}

export function StatCard({ number, label, type, colors }: StatCardProps) {
  // Resolve localized background accents dynamically based on intent
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return colors.successBackground || "#E6F4EA";
      case "info":
        return colors.infoBackground || "#E8F0FE";
      case "warning":
        return colors.warningBackground || "#FEF7E0";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return colors.success || "#137333";
      case "info":
        return colors.primary || "#1a73e8";
      case "warning":
        return colors.warning || "#b06000";
    }
  };

  return (
    <View style={[styles.statCard, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[styles.statNumber, { color: getTextColor() }]}>
        {number}
      </Text>
      <Text
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ==========================================
// ActionButton Component
// ==========================================
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  iconColor?: string;
  onPress?: () => void;
  colors: any;
}

export function ActionButton({
  icon,
  label,
  iconColor,
  onPress,
  colors,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: colors.backgroundSecondary },
        pressed && styles.actionPressed,
      ]}
    >
      <View
        style={[
          styles.actionIconWrapper,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        {/*<MaterialCommunityIcons name={icon} size={22} color={iconColor} />*/}
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

// ==========================================
// Module Scoped Stylesheet
// ==========================================
const styles = StyleSheet.create({
  statCard: {
    width: "31%",
    borderRadius: 16,
    padding: 14,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  actionButton: {
    width: "31%",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
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
