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
      <Text className="text-[13px] italic" style={{ color: colors.textSecondary }}>
        No items added to this RFQ.
      </Text>
    );
  }

  return (
    <View
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: colors.backgroundElement,
        borderColor: colors.border,
      }}
    >
      {items.map((item, idx) => (
        <View
          key={item.id}
          className="flex-row items-center justify-between px-3.5 py-3 gap-3"
          style={
            idx < items.length - 1
              ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
              : undefined
          }
        >
          <View className="flex-1 gap-0.5">
            <Text
              className="text-sm font-medium"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {getProductName(item.productId)}
            </Text>
            {item.comment?.trim() ? (
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {item.comment}
              </Text>
            ) : null}
          </View>
          <View className="items-end gap-1">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {item.quantity} {item.uom}
            </Text>
            {item.allowAlternatives && (
              <View
                className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: colors.info + "18" }}
              >
                <Text className="text-[11px] font-semibold" style={{ color: colors.info }}>
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

export default RxRfqReadonlyItemsList;

