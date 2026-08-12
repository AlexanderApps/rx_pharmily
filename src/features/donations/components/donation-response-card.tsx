import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { DonationResponse } from "@/features/donations/types/donation.types";

interface DonationResponseCardProps {
  response: DonationResponse;
  isOwner?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const STATUS_META: Record<
  DonationResponse["status"],
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" }
> = {
  pending: { label: "Pending", icon: "clock-outline", tone: "warning" },
  approved: { label: "Approved", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Declined", icon: "close-circle-outline", tone: "error" },
};

const DonationResponseCard: React.FC<DonationResponseCardProps> = ({
  response,
  isOwner = false,
  onApprove,
  onReject,
}) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[response.status];
  const statusColor = colors[statusMeta.tone];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.responder, { color: colors.text }]} numberOfLines={1}>
          {response.responderFacility}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + "18" }]}>
          <MaterialCommunityIcons name={statusMeta.icon} size={12} color={statusColor} />
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        {response.items.map((item) => (
          <View key={item.id} style={styles.itemLine}>
            <MaterialCommunityIcons name="tray-full" size={13} color={colors.textSecondary} />
            <Text style={[styles.itemText, { color: colors.text }]} numberOfLines={1}>
              {item.requestedQuantity} × {item.product}
            </Text>
          </View>
        ))}
      </View>

      {response.comment ? (
        <Text style={[styles.comment, { color: colors.textSecondary }]}>{response.comment}</Text>
      ) : null}

      <View style={styles.bottomRow}>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
          {format(response.createdAt)}
        </Text>

        {isOwner && response.status === "pending" && (onApprove || onReject) && (
          <View style={styles.actionsRow}>
            {onReject && (
              <Pressable
                onPress={onReject}
                style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
              >
                <MaterialCommunityIcons name="close" size={13} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Decline</Text>
              </Pressable>
            )}
            {onApprove && (
              <Pressable
                onPress={onApprove}
                style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
              >
                <MaterialCommunityIcons name="check" size={13} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default DonationResponseCard;

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  responder: { fontSize: 14, fontWeight: "600", flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  itemLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemText: { fontSize: 12, flex: 1 },
  comment: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  timeAgo: { fontSize: 11 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 11, fontWeight: "700" },
});
