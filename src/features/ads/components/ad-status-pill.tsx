import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { AdStatus } from "@/features/ads/types/ads.types";

interface AdStatusPillProps {
  status: AdStatus;
  compact?: boolean;
}

const STATUS_META: Record<AdStatus, { label: string; icon: string }> = {
  pending: { label: "Pending Review", icon: "clock-outline" },
  approved: { label: "Live", icon: "check-circle-outline" },
  rejected: { label: "Rejected", icon: "close-circle-outline" },
  suspended: { label: "Suspended", icon: "pause-circle-outline" },
  banned: { label: "Banned", icon: "cancel" },
};

const AdStatusPill: React.FC<AdStatusPillProps> = ({ status, compact = false }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[status];

  const color =
    status === "approved"
      ? colors.success
      : status === "pending"
        ? colors.warning
        : colors.error;

  return (
    <View style={[styles.pill, { backgroundColor: color + "18" }]}>
      <MaterialCommunityIcons name={meta.icon as any} size={compact ? 11 : 13} color={color} />
      <Text style={[styles.text, { color, fontSize: compact ? 10 : 11 }]}>{meta.label}</Text>
    </View>
  );
};

export default AdStatusPill;

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "700" },
});
