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
    <View style={styles.container}>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}

      {/* Pending RFQ items — tap to respond */}
      {pendingRfqItems.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={[styles.pendingTitle, { color: colors.textSecondary }]}>
            Awaiting response · {pendingRfqItems.length} item
            {pendingRfqItems.length > 1 ? "s" : ""}
          </Text>
          {pendingRfqItems.map((rfqItem) => (
            <TouchableOpacity
              key={rfqItem.id}
              style={[
                styles.pendingRow,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => openAddModal(rfqItem)}
              activeOpacity={0.7}
            >
              <View style={styles.pendingRowLeft}>
                <Text
                  style={[styles.pendingProduct, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {getProductName(rfqItem.productId)}
                </Text>
                <Text
                  style={[styles.pendingMeta, { color: colors.textSecondary }]}
                >
                  Qty {rfqItem.quantity}
                  {rfqItem.uom ? ` · ${rfqItem.uom}` : ""}
                  {rfqItem.allowAlternatives ? " · Alt. allowed" : ""}
                </Text>
              </View>
              <View
                style={[styles.respondBadge, { backgroundColor: colors.text }]}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={13}
                  color={colors.backgroundSecondary}
                />
                <Text
                  style={[
                    styles.respondBadgeText,
                    { color: colors.backgroundSecondary },
                  ]}
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
            style={[styles.respondedTitle, { color: colors.textSecondary }]}
          >
            Quoted · {items.length} item{items.length > 1 ? "s" : ""}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tableScroll}
          >
            <View
              style={[
                styles.tableContainer,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Table header */}
              {/*<View
                style={[
                  styles.tableHeader,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {(
                  [
                    ["Product", styles.productCol],
                    ["Qty", styles.qtyCol],
                    ["Rate", styles.rateCol],
                    ["Amount", styles.amountCol],
                    ["Alt", styles.altCol],
                    ["Cmt", styles.cmtCol],
                    ["", styles.actionsCol],
                  ] as [string, object][]
                ).map(([label, colStyle]) => (
                  <Text
                    key={label}
                    style={[
                      styles.headerCell,
                      colStyle,
                      { color: colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                ))}
              </View>*/}

              <View
                style={[
                  styles.tableHeader,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderBottomColor: colors.border,
                  },
                ]}
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
                    style={[
                      styles.tableRow,
                      { borderBottomColor: colors.border },
                    ]}
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
                        style={[
                          styles.altBadge,
                          {
                            backgroundColor: item.offeredAlternative
                              ? colors.warning + "20"
                              : colors.success + "20",
                          },
                        ]}
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

                    <View style={[styles.actionsCol, styles.rowActions]}>
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => openEditModal(item)}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconButton}
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
                style={[
                  styles.totalRow,
                  {
                    borderTopColor: colors.border,
                    backgroundColor: colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[styles.totalLabel, { color: colors.textSecondary }]}
                >
                  Total ({currency})
                </Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
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
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="inbox-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No items to respond to
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  errorText: { fontSize: 12, fontWeight: "500", marginBottom: 8 },

  pendingSection: { gap: 8, marginBottom: 20 },
  pendingTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  pendingRowLeft: { flex: 1, gap: 2 },
  pendingProduct: { fontSize: 14, fontWeight: "500" },
  pendingMeta: { fontSize: 12 },
  respondBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  respondBadgeText: { fontSize: 12, fontWeight: "600" },

  respondedTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tableScroll: { width: "100%" },
  tableContainer: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  // tableHeader: {
  //   flexDirection: "row",
  //   borderBottomWidth: 1,
  //   paddingVertical: 10,
  // },
  // tableRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   borderBottomWidth: StyleSheet.hairlineWidth,
  //   minHeight: 48,
  // },
  // headerCell: { fontSize: 12, fontWeight: "600", paddingHorizontal: 6 },
  // bodyCell: { fontSize: 12, fontWeight: "400", paddingHorizontal: 6 },
  cellCenter: { alignItems: "center", justifyContent: "center" },

  productCol: { width: 180 },
  qtyCol: { width: 50 },
  rateCol: { width: 80 },
  amountCol: { width: 90 },
  altCol: { width: 44 },
  cmtCol: { width: 40 },
  actionsCol: { width: 70 },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  actionIconButton: { padding: 4, marginHorizontal: 4 },
  altBadge: { padding: 4, borderRadius: 6 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 12, fontWeight: "500" },
  totalValue: { fontSize: 14, fontWeight: "600", paddingRight: 6 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySubtitle: { fontSize: 13, marginTop: 4, textAlign: "center" },
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

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default RxRfqResponseItemsTable;
