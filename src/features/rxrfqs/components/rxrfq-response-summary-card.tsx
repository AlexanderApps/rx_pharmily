import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqResponseCardData } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqResponseSummaryCardProps {
  response: RxRfqResponseCardData;
  currency: string;
  isAwarded?: boolean;
  onPress: () => void;
}

const fmtDate = (d?: Date) =>
  d
    ? d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const RxRfqResponseSummaryCard: React.FC<RxRfqResponseSummaryCardProps> = ({
  response,
  currency,
  isAwarded = false,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: isAwarded ? colors.success : colors.border,
          borderWidth: isAwarded ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <MaterialCommunityIcons
            name="storefront-outline"
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.facility, { color: colors.text }]}
            numberOfLines={1}
          >
            {response.vendorFacility}
          </Text>
          <Text
            style={[styles.meta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {response.submittedAt
              ? `Submitted ${fmtDate(response.submittedAt)}`
              : "Draft response"}
            {"  ·  Delivery "}
            {fmtDate(response.estimatedDeliveryDate)}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {isAwarded && (
          <View
            style={[
              styles.awardBadge,
              { backgroundColor: colors.success + "18" },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={12}
              color={colors.success}
            />
            <Text style={[styles.awardBadgeText, { color: colors.success }]}>
              Awarded
            </Text>
          </View>
        )}
        <Text style={[styles.amount, { color: colors.text }]}>
          {currency}{" "}
          {response.grandTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        {response.totalOptionalCosts > 0 && (
          <Text style={[styles.optionalNote, { color: colors.textSecondary }]}>
            +{currency}{" "}
            {response.totalOptionalCosts.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            optional
          </Text>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  facility: { fontSize: 14, fontWeight: "500" },
  meta: { fontSize: 11, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 14, fontWeight: "600" },
  optionalNote: { fontSize: 10 },
  awardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  awardBadgeText: { fontSize: 10, fontWeight: "700" },
});

export default RxRfqResponseSummaryCard;
