import React from "react";
import { View, Text } from "react-native";
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
  inactive: { label: "Paused", icon: "pause-circle-outline" },
  closed: { label: "Closed", icon: "archive-outline" },
};

const AdStatusPill: React.FC<AdStatusPillProps> = ({ status, compact = false }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[status];

  const color =
    status === "approved"
      ? colors.success
      : status === "pending"
        ? colors.warning
        : status === "inactive" || status === "closed"
          ? colors.textSecondary
          : colors.error;

  return (
    <View className="flex-row items-center gap-1 px-2 py-[3px] rounded-[7px] self-start" style={{ backgroundColor: color + "18" }}>
      <MaterialCommunityIcons name={meta.icon as any} size={compact ? 11 : 13} color={color} />
      <Text className="font-bold" style={{ color, fontSize: compact ? 10 : 11 }}>{meta.label}</Text>
    </View>
  );
};

export default AdStatusPill;

