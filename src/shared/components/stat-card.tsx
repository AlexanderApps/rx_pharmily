// Reusable Components inside the module boundary
import React from "react";
import { Pressable } from "react-native";
import { ThemedText } from "@/shared/components/themed-text";
import { noSelectStyle } from "@/shared/constants/text-selection";

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
      className={`w-[31%] rounded-2xl p-3.5 justify-center active:opacity-70 ${
        onPress ? "cursor-pointer hover:opacity-90" : ""
      }`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <ThemedText
        className="text-2xl font-bold"
        style={{ color: getTextColor(), ...noSelectStyle }}
      >
        {number}
      </ThemedText>
      <ThemedText
        className="text-xs font-medium mt-1"
        style={{ color: colors.textSecondary, ...noSelectStyle }}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}