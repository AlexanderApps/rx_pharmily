import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { DonationCardData } from "@/features/donations/types/donation.types";

interface DonationListCardProps {
  donation: DonationCardData;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const STATUS_META: Record<
  DonationCardData["status"],
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" }
> = {
  opened: { label: "Open", icon: "eye-outline", tone: "success" },
  hidden: { label: "Hidden", icon: "eye-off-outline", tone: "warning" },
  closed: { label: "Closed", icon: "lock-outline", tone: "error" },
};

const DonationListCard: React.FC<DonationListCardProps> = ({
  donation,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[donation.status];
  const statusColor = colors[statusMeta.tone];

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
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary + "18" }]}>
          <MaterialCommunityIcons name="hand-heart-outline" size={20} color={colors.secondary} />
        </View>

        <View style={styles.content}>
          <Text numberOfLines={1} style={[styles.facilityName, { color: colors.text }]}>
            {donation.facilityName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {donation.itemCount} {donation.itemCount === 1 ? "item" : "items"} available
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
          <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
        <Text numberOfLines={1} style={[styles.locationText, { color: colors.textSecondary }]}>
          {donation.location}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statsContainer}>
          <View style={[styles.badge, { backgroundColor: colors.info + "14" }]}>
            <MaterialCommunityIcons name="package-variant-closed" size={12} color={colors.info} />
            <Text style={[styles.badgeText, { color: colors.info }]}>{donation.itemCount}</Text>
          </View>

          {donation.responseCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.success + "14" }]}>
              <MaterialCommunityIcons name="hand-heart-outline" size={12} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>
                {donation.responseCount}
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
            {format(donation.createdAt)}
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
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, marginLeft: 52 },
  locationText: { flex: 1, fontSize: 12 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 52,
  },
  statsContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
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

export default DonationListCard;
