// Reusable Components inside the module boundary

import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/shared/components/themed-text";

// ==========================================
// StatCard Component
// ==========================================
interface StatCardProps {
  number: string;
  label: string;
  type: "success" | "info" | "warning";
  colors: any;
  onPress?: () => void; // Added optional click handler action property
}

export default function StatCard({
  number,
  label,
  type,
  colors,
  onPress,
}: StatCardProps) {
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
    // 1. Swapped root View with Pressable & injected dynamic active opacity states
    <Pressable
      onPress={onPress}
      disabled={!onPress} // Disables press telemetry interactions entirely if no handler hook function is passed
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.7 : 1, // Provides instant visual touch state feedback response
        },
      ]}
    >
      <ThemedText style={[styles.statNumber, { color: getTextColor() }]}>
        {number}
      </ThemedText>
      <ThemedText
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
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
});
