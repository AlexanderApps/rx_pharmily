import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { ConsultRequest, ConsultStatus } from "@/features/help/types/help.types";

interface ConsultRequestCardProps {
  request: ConsultRequest;
  onPress?: () => void;
}

const STATUS_META: Record<
  ConsultStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  pending: { label: "Pending", icon: "clock-outline", tone: "warning" },
  accepted: { label: "Accepted", icon: "calendar-check-outline", tone: "info" },
  completed: { label: "Completed", icon: "check-circle-outline", tone: "success" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
};

const ConsultRequestCard: React.FC<ConsultRequestCardProps> = ({ request, onPress }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[request.status];
  const toneColor = colors[meta.tone];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
          <MaterialCommunityIcons name="account-tie-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
            {request.subject}
          </Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{request.category}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: toneColor + "18" }]}>
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text style={[styles.statusText, { color: toneColor }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        {request.consultantName && (
          <Text style={[styles.consultant, { color: colors.textSecondary }]} numberOfLines={1}>
            with {request.consultantName}
          </Text>
        )}
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{format(request.createdAt)}</Text>
      </View>
    </Pressable>
  );
};

export default ConsultRequestCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  subject: { fontSize: 14, fontWeight: "700" },
  category: { fontSize: 11, marginTop: 1 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginLeft: 46 },
  consultant: { fontSize: 12, flex: 1 },
  timeAgo: { fontSize: 11 },
});
