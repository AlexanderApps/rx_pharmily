import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

export interface RxRfqResponseItem {
  id: string;
  rfqItemId: string;
  product: string;
  quantity: number;
  rate: number;
  amount: number;
  offeredAlternative: boolean;
  alternativeProductDetails?: string;
  comment?: string;
}

interface ResponseItemCardProps {
  item: RxRfqResponseItem;
  onPress?: (item: RxRfqResponseItem) => void;
}

export const ResponseItemCard = ({ item, onPress }: ResponseItemCardProps) => {
  const { colors } = useTheme();

  // Format currency values neatly
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Product Title Section */}
      <View style={styles.header}>
        <View style={styles.productTitleRow}>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.product}
          </Text>
          {item.offeredAlternative && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.text }]}>
                Alternative
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Alternative Details Warning Banner if offeredAlternative is true */}
      {item.offeredAlternative && item.alternativeProductDetails && (
        <View
          style={[
            styles.alternativeBox,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.alternativeText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.alternativeProductDetails}
          </Text>
        </View>
      )}

      {/* Numerical Metrics Matrix Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
            Qty
          </Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>
            {item.quantity}
          </Text>
        </View>

        <View style={styles.gridCol}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
            Rate
          </Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>
            {formatCurrency(item.rate)}
          </Text>
        </View>

        <View style={[styles.gridCol, styles.alignRight]}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
            Total Amount
          </Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      {/* Bottom Context Comment Area */}
      {item.comment && item.comment.trim().length > 0 && (
        <View
          style={[styles.commentSection, { borderTopColor: colors.border }]}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.commentText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.comment}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  alternativeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  alternativeText: {
    fontSize: 13,
    flex: 1,
    fontStyle: "italic",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridCol: {
    flexDirection: "column",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  commentSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 0.5,
    marginTop: 12,
    paddingTop: 10,
    gap: 6,
  },
  commentText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
