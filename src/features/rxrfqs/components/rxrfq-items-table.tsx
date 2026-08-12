import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import RxRfQItemModal from "@/features/rxrfqs/components/rxrfq-item-modal";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RxRfqItem } from "@/features/rxrfqs/types/rxrfqs.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

interface RxRfQItemsTableProps {
  items: RxRfqItem[];
  onChange: (items: RxRfqItem[]) => void;
  error?: string;
}

const RxRfQItemsTable: React.FC<RxRfQItemsTableProps> = ({
  items,
  onChange,
  error,
}) => {
  const { colors } = useTheme();
  const products = useCatalogStore((state) => state.products);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editingItem, setEditingItem] = useState<RxRfqItem | null>(null);

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? "Unknown product";

  const handleAddItem = (item: RxRfqItem) => {
    onChange([...items, item]);
    sheetRef.current?.dismiss();
  };

  const handleUpdateItem = (updatedItem: RxRfqItem) => {
    onChange(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setEditingItem(null);
    sheetRef.current?.dismiss();
  };

  const handleDeleteItem = (itemId: string) => {
    onChange(items.filter((i) => i.id !== itemId));
  };

  const handleEditItem = (item: RxRfqItem) => {
    setEditingItem(item);
    sheetRef.current?.present();
  };

  const openAddModal = () => {
    setEditingItem(null);
    sheetRef.current?.present();
  };

  const columns = [
    { title: "Product", style: styles.productColumn },
    { title: "Qty", style: styles.quantityColumn },
    { title: "UOM", style: styles.uomColumn },
    { title: "Allow Alt.", style: styles.allowAlternativeColumn },
    { title: "Comments", style: styles.commentColumn },
    { title: "Actions", style: styles.actionsColumn },
  ];

  return (
    <View style={styles.container}>
      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.addInlineButton, { backgroundColor: colors.text }]}
          onPress={openAddModal}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={colors.backgroundSecondary}
          />
          <Text
            style={[
              styles.addInlineButtonText,
              { color: colors.backgroundSecondary },
            ]}
          >
            Add Item
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}

      {items.length === 0 ? (
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

          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No items added yet
          </Text>

          <Text
            style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}
          >
            Add RxRfQ items to continue
          </Text>

          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.text }]}
            onPress={openAddModal}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.backgroundSecondary}
            />

            <Text
              style={[
                styles.emptyStateButtonText,
                { color: colors.backgroundSecondary },
              ]}
            >
              Add First Item
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
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
            {/* Header */}
            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.productColumn,
                  { color: colors.text },
                ]}
              >
                Product
              </Text>

              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.quantityColumn,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                Qty
              </Text>

              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.uomColumn,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                UOM
              </Text>

              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.allowAlternativeColumn,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                Alt
              </Text>

              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.commentColumn,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                Cmt
              </Text>

              <Text
                style={[
                  styles.cellText,
                  styles.headerCell,
                  styles.actionsColumn,
                  { color: colors.text, textAlign: "center" },
                ]}
              >
                Actions
              </Text>
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
                      styles.cellText,
                      styles.bodyCell,
                      styles.productColumn,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getProductName(item.productId)}
                  </Text>

                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.quantityColumn,
                      {
                        color: colors.text,
                        textAlign: "center",
                      },
                    ]}
                  >
                    {item.quantity}
                  </Text>

                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.uomColumn,
                      {
                        color: colors.text,
                        textAlign: "center",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.uom || "-"}
                  </Text>

                  <View
                    style={[styles.allowAlternativeColumn, styles.cellCenter]}
                  >
                    <View
                      style={[
                        styles.allowAlternativeBadge,
                        {
                          backgroundColor: item.allowAlternatives
                            ? colors.success + "20"
                            : colors.error + "20",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.allowAlternatives ? "check" : "close"}
                        size={12}
                        color={
                          item.allowAlternatives ? colors.success : colors.error
                        }
                      />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.commentColumn,
                      {
                        color: colors.textSecondary,
                        textAlign: "center",
                      },
                    ]}
                  >
                    {item.comment?.trim() ? "..." : "-"}
                  </Text>

                  <View style={[styles.actionsColumn, styles.rowActions]}>
                    <TouchableOpacity
                      onPress={() => handleEditItem(item)}
                      style={styles.actionIconButton}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      style={styles.actionIconButton}
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
          </View>
        </ScrollView>
      )}

      <RxRfQItemModal
        ref={sheetRef}
        onClose={() => setEditingItem(null)}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        initialData={editingItem}
        isEditing={!!editingItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  // actionsContainer: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   marginBottom: 12,
  // },

  // viewButton: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 6,
  //   paddingHorizontal: 12,
  //   paddingVertical: 8,
  //   borderRadius: 8,
  //   borderWidth: 1,
  // },

  // viewButtonText: {
  //   fontSize: 13,
  //   fontWeight: "600",
  // },

  addInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  addInlineButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  errorText: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },

  emptyStateSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },

  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  tableScroll: {
    width: "100%",
  },

  tableContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },

  cellText: {
    fontSize: 12,
    paddingHorizontal: 6,
  },

  headerCell: {
    fontWeight: "600",
  },

  bodyCell: {
    fontWeight: "400",
  },

  cellCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  productColumn: {
    width: 180,
  },

  quantityColumn: {
    width: 50,
  },

  uomColumn: {
    width: 60,
  },

  allowAlternativeColumn: {
    width: 50,
  },

  commentColumn: {
    width: 40,
  },

  actionsColumn: {
    width: 70,
  },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  actionIconButton: {
    padding: 4,
    marginHorizontal: 4,
  },

  allowAlternativeBadge: {
    padding: 4,
    borderRadius: 6,
  },
});

export default RxRfQItemsTable;
