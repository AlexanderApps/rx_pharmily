import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { KycStatus } from "@/features/profile/types/profile.types";

interface KycStatusBadgeProps {
  status: KycStatus;
  compact?: boolean;
}

const STATUS_META: Record<
  KycStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  unverified: { label: "Not Verified", icon: "shield-outline", tone: "info" },
  pending: { label: "Pending Review", icon: "clock-outline", tone: "warning" },
  verified: { label: "Verified", icon: "shield-check", tone: "success" },
  rejected: { label: "Rejected", icon: "shield-alert-outline", tone: "error" },
};

const KycStatusBadge: React.FC<KycStatusBadgeProps> = ({ status, compact = false }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[status];
  const color = colors[meta.tone];

  return (
    <View style={[styles.pill, { backgroundColor: color + "18" }]}>
      <MaterialCommunityIcons name={meta.icon} size={compact ? 11 : 13} color={color} />
      <Text style={[styles.text, { color, fontSize: compact ? 10 : 11 }]}>{meta.label}</Text>
    </View>
  );
};

export default KycStatusBadge;

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "700" },
});
