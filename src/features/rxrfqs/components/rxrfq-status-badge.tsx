import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqStatusType } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqStatusBadgeProps {
  status: RxRfqStatusType;
  size?: "sm" | "md";
}

export const getStatusMeta = (status: RxRfqStatusType, colors: any) => {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        icon: "pencil-outline",
        color: colors.textSecondary,
      };
    case "published":
      return { label: "Published", icon: "earth", color: colors.info };
    case "closed":
      return { label: "Closed", icon: "lock-outline", color: colors.warning };
    case "awarded":
      return {
        label: "Awarded",
        icon: "trophy-outline",
        color: colors.success,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: "close-circle-outline",
        color: colors.error,
      };
    case "expired":
      return {
        label: "Expired",
        icon: "clock-alert-outline",
        color: colors.error,
      };
    default:
      return {
        label: status,
        icon: "information-outline",
        color: colors.textSecondary,
      };
  }
};

const RxRfqStatusBadge: React.FC<RxRfqStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const { colors } = useTheme();
  const meta = getStatusMeta(status, colors);
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: meta.color + "18" },
      ]}
    >
      <MaterialCommunityIcons
        name={meta.icon as any}
        size={isSm ? 11 : 13}
        color={meta.color}
      />
      <Text style={[styles.text, isSm && styles.textSm, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeSm: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: "600" },
  textSm: { fontSize: 11 },
});

export default RxRfqStatusBadge;
