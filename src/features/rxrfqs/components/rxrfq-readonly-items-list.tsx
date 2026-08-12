import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqItem } from "@/features/rxrfqs/types/rxrfqs.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

interface RxRfqReadonlyItemsListProps {
  items: RxRfqItem[];
}

const RxRfqReadonlyItemsList: React.FC<RxRfqReadonlyItemsListProps> = ({
  items,
}) => {
  const { colors } = useTheme();
  const products = useCatalogStore((state) => state.products);
  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? "Unknown product";

  if (items.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No items added to this RFQ.
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.list,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
        },
      ]}
    >
      {items.map((item, idx) => (
        <View
          key={item.id}
          style={[
            styles.row,
            idx < items.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.rowLeft}>
            <Text
              style={[styles.product, { color: colors.text }]}
              numberOfLines={1}
            >
              {getProductName(item.productId)}
            </Text>
            {item.comment?.trim() ? (
              <Text
                style={[styles.comment, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.comment}
              </Text>
            ) : null}
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.qty, { color: colors.text }]}>
              {item.quantity} {item.uom}
            </Text>
            {item.allowAlternatives && (
              <View
                style={[
                  styles.altPill,
                  { backgroundColor: colors.info + "18" },
                ]}
              >
                <Text style={[styles.altPillText, { color: colors.info }]}>
                  Alt. OK
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 2 },
  product: { fontSize: 14, fontWeight: "500" },
  comment: { fontSize: 12 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  qty: { fontSize: 13, fontWeight: "500" },
  altPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  altPillText: { fontSize: 11, fontWeight: "600" },
  emptyText: { fontSize: 13, fontStyle: "italic" },
});

export default RxRfqReadonlyItemsList;
