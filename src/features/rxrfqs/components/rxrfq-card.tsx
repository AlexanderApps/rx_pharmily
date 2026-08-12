import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqCardData, RxRfqStatusType } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqCardProps {
  rfq: RxRfqCardData;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const STATUS_META: Record<
  RxRfqStatusType,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  draft: { label: "Draft", icon: "file-outline", tone: "info" },
  published: { label: "Published", icon: "eye-outline", tone: "success" },
  closed: { label: "Closed", icon: "lock-outline", tone: "warning" },
  awarded: { label: "Awarded", icon: "trophy-outline", tone: "success" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
  expired: { label: "Expired", icon: "clock-alert-outline", tone: "error" },
};

const RxRfqCard: React.FC<RxRfqCardProps> = ({
  rfq,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[rfq.status];
  const statusColor = colors[statusMeta.tone];

  const formatDate = (dateString: Date | string): string => {
    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return String(dateString);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
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
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "18" }]}>
          <MaterialCommunityIcons name="hospital-building" size={20} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <Text numberOfLines={1} style={[styles.facilityName, { color: colors.text }]}>
            {rfq.facilityName}
          </Text>
          <Text style={[styles.code, { color: colors.textSecondary }]}>{rfq.code}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
          <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
        <Text numberOfLines={1} style={[styles.locationText, { color: colors.textSecondary }]}>
          {rfq.facilityLocation}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statsContainer}>
          <View style={[styles.badge, { backgroundColor: colors.info + "14" }]}>
            <MaterialCommunityIcons name="pill" size={12} color={colors.info} />
            <Text style={[styles.badgeText, { color: colors.info }]}>
              {rfq.productCount} {rfq.productCount === 1 ? "item" : "items"}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: colors.warning + "14" }]}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.warning }]}>
              {formatDate(rfq.submissionDeadline)}
            </Text>
          </View>

          {rfq.responseCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.success + "14" }]}>
              <MaterialCommunityIcons name="reply-all-outline" size={12} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {rfq.responseCount}
              </Text>
            </View>
          )}
        </View>

        {showActions && (onEdit || onDelete) ? (
          <View style={styles.actionButtons}>
            {onEdit && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(rfq.publishedAt)}
          </Text>
        )}
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, marginLeft: 12 },
  facilityName: { fontSize: 15, fontWeight: "700" },
  code: { fontSize: 11, marginTop: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, marginLeft: 52 },
  locationText: { flex: 1, fontSize: 12 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 52,
  },
  statsContainer: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1 },
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
  actionButtons: { flexDirection: "row", alignItems: "center" },
  iconButton: { padding: 4, marginLeft: 8 },
});

export default RxRfqCard;
