import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  RxRfqItem,
  RxRfqResponseItem,
} from "@/features/rxrfqs/types/rxrfqs.types";
import RxRfqResponseItemModal from "@/features/rxrfqs/components/rxrfq-res-item-modal";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

interface RxRfqResponseItemsTableProps {
  rfqItems: RxRfqItem[]; // Original RFQ lines — drives which items can be responded to
  items: RxRfqResponseItem[];
  currency: string;
  onChange: (items: RxRfqResponseItem[]) => void;
  error?: string;
  // The facility responding to the RFQ — scopes which price lists
  // PriceComboBox can search inside the item modal.
  facilityId?: string;
}

const RxRfqResponseItemsTable: React.FC<RxRfqResponseItemsTableProps> = ({
  rfqItems,
  items,
  currency,
  onChange,
  error,
  facilityId,
}) => {
  const { colors } = useTheme();
  const products = useCatalogStore((state) => state.products);
  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? "Unknown product";
  const sheetRef = useRef<BottomSheetModal>(null);
  const [activeRfqItem, setActiveRfqItem] = useState<RxRfqItem | null>(null);
  const [editingItem, setEditingItem] = useState<RxRfqResponseItem | null>(
    null,
  );
  // Column widths/alignment are stored as data here (used by the dynamic
  // header render below via columns.map), so they stay as plain style
  // objects rather than className — a runtime data array of style values
  // isn't something className can represent the same way.
  const columns = [
    { label: "Product", style: styles.productCol, align: "left" },
    { label: "Qty", style: styles.qtyCol, align: "center" },
    { label: "Rate", style: styles.rateCol, align: "right" },
    { label: "Amount", style: styles.amountCol, align: "right" },
    { label: "Alt", style: styles.altCol, align: "center" },
    { label: "Cmt", style: styles.cmtCol, align: "center" },
    { label: "Action", style: styles.actionsCol, align: "center" },
  ];

  const grandTotal = items.reduce((sum, i) => sum + i.amount, 0);

  const respondedIds = new Set(items.map((i) => i.rfqItemId));
  const pendingRfqItems = rfqItems.filter((i) => !respondedIds.has(i.id));

  const openAddModal = (rfqItem: RxRfqItem) => {
    setEditingItem(null);
    setActiveRfqItem(rfqItem);

    requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
  };

  const openEditModal = (responseItem: RxRfqResponseItem) => {
    const rfqItem = rfqItems.find((r) => r.id === responseItem.rfqItemId);

    if (!rfqItem) return;

    setActiveRfqItem(rfqItem);
    setEditingItem(responseItem);

    requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
  };

  const handleSave = (item: RxRfqResponseItem) => {
    if (editingItem) {
      onChange(items.map((i) => (i.id === item.id ? item : i)));
    } else {
      onChange([...items, item]);
    }
    setEditingItem(null);
    setActiveRfqItem(null);
    sheetRef.current?.dismiss();
  };

  const handleDelete = (itemId: string) => {
    onChange(items.filter((i) => i.id !== itemId));
  };

  const handleClose = () => {
    setEditingItem(null);
    setActiveRfqItem(null);
  };

  return (
    <View className="w-full">
      {error && (
        <Text className="text-xs font-medium mb-2" style={{ color: colors.error }}>{error}</Text>
      )}

      {/* Pending RFQ items — tap to respond */}
      {pendingRfqItems.length > 0 && (
        <View className="gap-2 mb-5">
          <Text className="text-xs font-medium uppercase tracking-[0.5px]" style={{ color: colors.textSecondary }}>
            Awaiting response · {pendingRfqItems.length} item
            {pendingRfqItems.length > 1 ? "s" : ""}
          </Text>
          {pendingRfqItems.map((rfqItem) => (
            <TouchableOpacity
              key={rfqItem.id}
              className="flex-row items-center justify-between px-3.5 py-3 rounded-[10px] border gap-3"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              }}
              onPress={() => openAddModal(rfqItem)}
              activeOpacity={0.7}
            >
              <View className="flex-1 gap-0.5">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {getProductName(rfqItem.productId)}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Qty {rfqItem.quantity}
                  {rfqItem.uom ? ` · ${rfqItem.uom}` : ""}
                  {rfqItem.allowAlternatives ? " · Alt. allowed" : ""}
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: colors.text }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={13}
                  color={colors.backgroundSecondary}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.backgroundSecondary }}
                >
                  Respond
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Response table */}
      {items.length > 0 && (
        <>
          <Text
            className="text-xs font-medium uppercase tracking-[0.5px] mb-2"
            style={{ color: colors.textSecondary }}
          >
            Quoted · {items.length} item{items.length > 1 ? "s" : ""}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="w-full"
          >
            <View
              className="border rounded-[10px] overflow-hidden"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              }}
            >
              {/* Table header */}
              <View
                className="flex-row items-center border-b py-3"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderBottomColor: colors.border,
                }}
              >
                {columns.map((column) => (
                  <Text
                    key={column.label}
                    style={[
                      styles.headerCell,
                      column.style,
                      column.align === "center" && styles.centerText,
                      column.align === "right" && styles.rightText,
                      { color: colors.text },
                    ]}
                  >
                    {column.label}
                  </Text>
                ))}
              </View>

              {/* Rows */}
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    className="flex-row items-center min-h-[52px]"
                    style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
                  >
                    <Text
                      style={[
                        styles.bodyCell,
                        styles.productCol,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {getProductName(item.productId)}
                    </Text>

                    <Text
                      style={[
                        styles.bodyCell,
                        styles.qtyCol,
                        styles.centerText,
                        { color: colors.text },
                      ]}
                    >
                      {item.quantity}
                    </Text>

                    <Text
                      style={[
                        styles.bodyCell,
                        styles.rateCol,
                        styles.rightText,
                        { color: colors.text },
                      ]}
                    >
                      {item.rate.toFixed(2)}
                    </Text>

                    <Text
                      style={[
                        styles.bodyCell,
                        styles.amountCol,
                        styles.rightText,
                        {
                          color: colors.text,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {item.amount.toFixed(2)}
                    </Text>

                    <View style={[styles.altCol, styles.cellCenter]}>
                      <View
                        className="p-1 rounded-md"
                        style={{
                          backgroundColor: item.offeredAlternative
                            ? colors.warning + "20"
                            : colors.success + "20",
                        }}
                      >
                        <MaterialCommunityIcons
                          name={
                            item.offeredAlternative
                              ? "swap-horizontal"
                              : "check"
                          }
                          size={12}
                          color={
                            item.offeredAlternative
                              ? colors.warning
                              : colors.success
                          }
                        />
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.bodyCell,
                        styles.cmtCol,
                        styles.centerText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.comment?.trim() ? "..." : "-"}
                    </Text>

                    <View style={styles.actionsCol} className="flex-row items-center justify-center gap-0.5">
                      <TouchableOpacity
                        className="p-1 mx-1"
                        onPress={() => openEditModal(item)}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="p-1 mx-1"
                        onPress={() => handleDelete(item.id)}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={16}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              {/* Grand total row */}
              <View
                className="flex-row justify-between items-center px-3 py-2.5 border-t"
                style={{
                  borderTopColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Total ({currency})
                </Text>
                <Text className="text-sm font-semibold pr-1.5" style={{ color: colors.text }}>
                  {grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {/* Empty state — only shown when nothing is responded yet */}
      {items.length === 0 && pendingRfqItems.length === 0 && (
        <View
          className="items-center justify-center py-10 px-5 rounded-xl border border-dashed"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons
            name="inbox-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text className="text-base font-semibold mt-3" style={{ color: colors.text }}>
            No items to respond to
          </Text>
          <Text className="text-[13px] mt-1 text-center" style={{ color: colors.textSecondary }}>
            The RFQ has no line items yet.
          </Text>
        </View>
      )}

      <RxRfqResponseItemModal
        ref={sheetRef}
        rfqItem={
          activeRfqItem ??
          ({
            id: "",
            product: "",
            quantity: 0,
            allowAlternatives: false,
          } as RxRfqItem)
        }
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingItem}
        isEditing={!!editingItem}
        facilityId={facilityId}
        currency={currency}
      />
    </View>
  );
};

// Only the column widths/alignment/text styles remain here — these are
// referenced dynamically via the columns array above (columns.map), which
// a data-driven className string can't cleanly express, so they stay as
// StyleSheet objects rather than being converted.
const styles = StyleSheet.create({
  cellCenter: { alignItems: "center", justifyContent: "center" },

  productCol: { width: 180 },
  qtyCol: { width: 50 },
  rateCol: { width: 80 },
  amountCol: { width: 90 },
  altCol: { width: 44 },
  cmtCol: { width: 40 },
  actionsCol: { width: 70 },

  centerText: {
    textAlign: "center",
  },

  rightText: {
    textAlign: "right",
  },

  headerCell: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 6,
  },

  bodyCell: {
    fontSize: 12,
    paddingHorizontal: 6,
  },
});

export default RxRfqResponseItemsTable;
