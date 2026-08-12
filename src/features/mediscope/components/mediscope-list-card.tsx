import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";

interface MediscopeListCardProps {
  item: MediscopeCardData;
  onPress?: (item: MediscopeCardData) => void;
}

const STATUS_META: Record<
  MediscopeCardData["status"],
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  draft: { label: "Draft", icon: "file-outline", tone: "info" },
  published: { label: "Published", icon: "eye-outline", tone: "success" },
  fulfilled: { label: "Fulfilled", icon: "trophy-outline", tone: "success" },
  closed: { label: "Closed", icon: "lock-outline", tone: "warning" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
  expired: { label: "Expired", icon: "clock-alert-outline", tone: "error" },
};

const MediscopeListCard: React.FC<MediscopeListCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[item.status];
  const statusColor = colors[statusMeta.tone];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {item.imageUrl ? (
          <LoadingImage source={{ uri: item.imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.secondary + "18" }]}>
            <MaterialCommunityIcons name="pill" size={20} color={colors.secondary} />
          </View>
        )}

        <View style={styles.content}>
          <Text numberOfLines={1} style={[styles.product, { color: colors.text }]}>
            {item.product}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.facilityName} · {item.facilityLocation}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
          <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.badge, { backgroundColor: colors.info + "14" }]}>
          <MaterialCommunityIcons name="reply-all-outline" size={12} color={colors.info} />
          <Text style={[styles.badgeText, { color: colors.info }]}>
            {item.responseCount} {item.responseCount === 1 ? "response" : "responses"}
          </Text>
        </View>

        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
          {format(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 44, height: 44, borderRadius: 12 },
  thumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  content: { flex: 1, marginLeft: 12 },
  product: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 56,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  timeAgo: { fontSize: 11 },
});

export default MediscopeListCard;
