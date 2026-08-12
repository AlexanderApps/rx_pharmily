import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  RxRfqAdditionalCostItem,
  RxRfqAdditionalCostType,
} from "@/features/rxrfqs/types/rxrfqs.types";
import RxRfqAdditionalCostModal from "@/features/rxrfqs/components/rxrfq-additional-cost-modal";

interface RxRfqAdditionalCostsTableProps {
  items: RxRfqAdditionalCostItem[];
  currency: string;
  onChange: (items: RxRfqAdditionalCostItem[]) => void;
  error?: string;
}

const COST_TYPE_META: Record<
  RxRfqAdditionalCostType,
  { label: string; icon: string }
> = {
  delivery: { label: "Delivery", icon: "truck-outline" },
  insurance: { label: "Insurance", icon: "shield-outline" },
  handling: { label: "Handling", icon: "hand-coin-outline" },
  tax: { label: "Tax", icon: "receipt-outline" },
  other: { label: "Other", icon: "dots-horizontal-circle-outline" },
};

const RxRfqAdditionalCostsTable: React.FC<RxRfqAdditionalCostsTableProps> = ({
  items,
  currency,
  onChange,
  error,
}) => {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editingItem, setEditingItem] =
    useState<RxRfqAdditionalCostItem | null>(null);

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  const openAdd = () => {
    setEditingItem(null);
    sheetRef.current?.present();
  };

  const openEdit = (item: RxRfqAdditionalCostItem) => {
    setEditingItem(item);
    sheetRef.current?.present();
  };

  const handleSave = (item: RxRfqAdditionalCostItem) => {
    if (editingItem) {
      onChange(items.map((i) => (i.id === item.id ? item : i)));
    } else {
      onChange([...items, item]);
    }
    setEditingItem(null);
    sheetRef.current?.dismiss();
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {items.length > 0
            ? `${items.length} cost${items.length > 1 ? "s" : ""} added`
            : "No additional costs"}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.text }]}
          onPress={openAdd}
        >
          <MaterialCommunityIcons
            name="plus"
            size={15}
            color={colors.backgroundSecondary}
          />
          <Text
            style={[
              styles.addButtonText,
              { color: colors.backgroundSecondary },
            ]}
          >
            Add Cost
          </Text>
        </TouchableOpacity>
      </View>

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
            name="cash-plus"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No additional costs
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add delivery, tax, handling or other charges.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />
            )}
            style={[
              styles.list,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
            renderItem={({ item }) => {
              const meta = COST_TYPE_META[item.costType];
              return (
                <View style={styles.row}>
                  {/* Left: icon + text */}
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.rowBody}>
                    <View style={styles.rowTopLine}>
                      <Text
                        style={[styles.rowDescription, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                      {item.isRequired && (
                        <View
                          style={[
                            styles.requiredBadge,
                            { backgroundColor: colors.error + "18" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.requiredBadgeText,
                              { color: colors.error },
                            ]}
                          >
                            Required
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.rowMeta, { color: colors.textSecondary }]}
                    >
                      {meta.label}
                    </Text>
                  </View>

                  {/* Right: amount + actions */}
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowAmount, { color: colors.text }]}>
                      {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        onPress={() => openEdit(item)}
                        style={styles.actionBtn}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.actionBtn}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={16}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* Total */}
          <View
            style={[
              styles.totalRow,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Additional costs total ({currency})
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </>
      )}

      <RxRfqAdditionalCostModal
        ref={sheetRef}
        onClose={() => setEditingItem(null)}
        onSave={handleSave}
        initialData={editingItem}
        isEditing={!!editingItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%", gap: 12 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: { fontSize: 12, fontWeight: "500" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonText: { fontSize: 13, fontWeight: "600" },

  errorText: { fontSize: 12, fontWeight: "500" },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  emptySubtitle: { fontSize: 13, textAlign: "center" },

  list: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  separator: { height: StyleSheet.hairlineWidth },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 2 },
  rowTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowDescription: { fontSize: 14, fontWeight: "500", flex: 1 },
  rowMeta: { fontSize: 12 },
  requiredBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredBadgeText: { fontSize: 11, fontWeight: "600" },

  rowRight: { alignItems: "flex-end", gap: 4 },
  rowAmount: { fontSize: 14, fontWeight: "600" },
  rowActions: { flexDirection: "row", gap: 2 },
  actionBtn: { padding: 4, marginHorizontal: 2 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 12, fontWeight: "500" },
  totalValue: { fontSize: 15, fontWeight: "600" },
});

export default RxRfqAdditionalCostsTable;
