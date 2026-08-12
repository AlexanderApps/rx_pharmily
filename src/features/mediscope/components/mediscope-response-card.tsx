import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatAmount } from "@/shared/utils/format";
import { MediscopeResponse } from "@/features/mediscope/types/mediscope.types";

interface MediscopeResponseCardProps {
  response: MediscopeResponse;
  isFulfilled?: boolean;
}

const MediscopeResponseCard: React.FC<MediscopeResponseCardProps> = ({
  response,
  isFulfilled = false,
}) => {
  const { colors } = useTheme();
  const isFull = response.availability === "full";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: isFulfilled ? colors.success : colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.vendor, { color: colors.text }]} numberOfLines={1}>
          {response.vendorFacility}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: (isFull ? colors.success : colors.warning) + "20" },
          ]}
        >
          <MaterialCommunityIcons
            name={isFull ? "check-circle-outline" : "circle-half-full"}
            size={12}
            color={isFull ? colors.success : colors.warning}
          />
          <Text style={[styles.badgeText, { color: isFull ? colors.success : colors.warning }]}>
            {isFull ? "Fully available" : "Partial"}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSecondary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {response.facilityWhereAvailable}
        </Text>
      </View>

      {response.comment ? (
        <Text style={[styles.comment, { color: colors.textSecondary }]}>{response.comment}</Text>
      ) : null}

      <View style={styles.bottomRow}>
        <Text style={[styles.cost, { color: colors.text }]}>
          {response.currency} {formatAmount(response.cost)}
        </Text>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
          {format(response.createdAt)}
        </Text>
      </View>

      {isFulfilled && (
        <View style={[styles.fulfilledStrip, { backgroundColor: colors.success + "18" }]}>
          <MaterialCommunityIcons name="trophy-outline" size={13} color={colors.success} />
          <Text style={[styles.fulfilledText, { color: colors.success }]}>
            Selected as the fulfilling response
          </Text>
        </View>
      )}
    </View>
  );
};

export default MediscopeResponseCard;

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  vendor: { fontSize: 14, fontWeight: "600", flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, flex: 1 },
  comment: { fontSize: 12, lineHeight: 17 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  cost: { fontSize: 15, fontWeight: "700" },
  timeAgo: { fontSize: 11 },
  fulfilledStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  fulfilledText: { fontSize: 11, fontWeight: "600" },
});
