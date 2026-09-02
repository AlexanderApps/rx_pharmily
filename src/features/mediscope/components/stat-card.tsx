// Reusable Components inside the module boundary
import React from "react";
import { View, Text, Pressable } from "react-native";
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
    <View
      className="w-[31%] rounded-2xl p-3.5 justify-center"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Text
        className="text-2xl font-bold"
        style={{ color: getTextColor() }}
      >
        {number}
      </Text>
      <Text
        className="text-xs font-medium mt-1"
        style={{ color: colors.textSecondary }}
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
      className="w-[31%] rounded-2xl p-3 items-center justify-center active:opacity-80"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: colors.backgroundElement }}
      >
        {/* <MaterialCommunityIcons name={icon} size={22} color={iconColor} /> */}
        {icon}
      </View>
      <Text
        className="text-[13px] font-medium"
        style={{ color: colors.text }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}