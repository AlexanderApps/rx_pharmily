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
import { Colors } from "@/shared/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DonatedItemModal from "@/features/donations/components/donated-item-modal";
import { DonationItem } from "@/features/donations/types/donation.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

type ThemeColors = (typeof Colors)["light"];

const DAY_MS = 24 * 60 * 60 * 1000;

function formatExpiry(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

function getExpiryColor(date: Date, colors: ThemeColors) {
  const days = daysUntil(date);
  if (days < 0) return colors.error;
  if (days <= 30) return colors.warning;
  return colors.text;
}

function getExpiryLabel(date: Date) {
  const days = daysUntil(date);
  if (days < 0) return "Expired";
  if (days <= 30) return "Expiring soon";
  return null;
}

interface DonatedItemsTableProps {
  items: DonationItem[];
  onChange: (items: DonationItem[]) => void;
  error?: string;
}

const DonatedItemsTable: React.FC<DonatedItemsTableProps> = ({
  items,
  onChange,
  error,
}) => {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editingItem, setEditingItem] = useState<DonationItem | null>(null);

  const handleAddItem = (item: DonationItem) => {
    onChange([...items, item]);
    sheetRef.current?.dismiss();
  };

  const handleUpdateItem = (updatedItem: DonationItem) => {
    onChange(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setEditingItem(null);
    sheetRef.current?.dismiss();
  };

  const handleDeleteItem = (itemId: string) => {
    onChange(items.filter((i) => i.id !== itemId));
  };

  const handleEditItem = (item: DonationItem) => {
    setEditingItem(item);
    sheetRef.current?.present(); // Direct ref invocation 🚀
  };

  const openAddModal = () => {
    setEditingItem(null);
    sheetRef.current?.present(); // Direct ref invocation 🚀
  };

  return (
    <View className="w-full">
      {items.length > 0 && (
        <TouchableOpacity
          className="flex-row items-center self-end gap-1.5 px-3 py-2 rounded-md mb-3"
          style={{ backgroundColor: colors.text }}
          onPress={openAddModal}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={colors.backgroundSecondary}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: colors.backgroundSecondary }}
          >
            Add Item
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text className="text-xs font-medium mb-2" style={{ color: colors.error }}>{error}</Text>
      )}

      {items.length === 0 ? (
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
            No items added yet
          </Text>
          <Text
            className="text-[13px] mt-1 mb-4 text-center"
            style={{ color: colors.textSecondary }}
          >
            Add donated items to continue
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ backgroundColor: colors.text }}
            onPress={openAddModal}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.backgroundSecondary}
            />
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.backgroundSecondary }}
            >
              Add First Item
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="w-full"
        >
          <View
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
          >
            <View
              className="flex-row border-b py-2.5"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderBottomColor: colors.border,
              }}
            >
              {[
                "Product",
                "Qty",
                "Batch",
                "Expiry",
                "Status",
                "Active",
                "Action",
              ].map((h, i) => (
                <Text
                  key={h}
                  style={[
                    styles.cellText,
                    styles.headerCell,
                    styles[`${h.toLowerCase()}Column` as keyof typeof styles],
                    { color: colors.text },
                  ]}
                >
                  {h}
                </Text>
              ))}
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  className="flex-row items-center"
                  style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 12 }}
                >
                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.productColumn,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.product}
                  </Text>
                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.qtyColumn,
                      { color: colors.text, textAlign: "center" },
                    ]}
                  >
                    {item.quantity}
                  </Text>
                  <Text
                    style={[
                      styles.cellText,
                      styles.bodyCell,
                      styles.batchColumn,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.batch || "—"}
                  </Text>
                  <View style={styles.expiryColumn}>
                    <Text
                      style={[
                        styles.cellText,
                        styles.bodyCell,
                        { color: getExpiryColor(item.expiryDate, colors) },
                      ]}
                    >
                      {formatExpiry(item.expiryDate)}
                    </Text>
                    {getExpiryLabel(item.expiryDate) && (
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: getExpiryColor(item.expiryDate, colors) }}
                      >
                        {getExpiryLabel(item.expiryDate)}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusColumn, styles.cellCenter]}>
                    <View
                      className="p-1 rounded-md"
                      style={{
                        backgroundColor: item.status
                          ? colors.success + "20"
                          : colors.error + "20",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.status ? "check-circle" : "close-circle"}
                        size={14}
                        color={item.status ? colors.success : colors.error}
                      />
                    </View>
                  </View>
                  <View style={[styles.activeColumn, styles.cellCenter]}>
                    <View
                      className="p-1 rounded-md"
                      style={{
                        backgroundColor: item.isActive
                          ? colors.success + "20"
                          : colors.error + "20",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.isActive ? "check" : "close"}
                        size={12}
                        color={item.isActive ? colors.success : colors.error}
                      />
                    </View>
                  </View>
                  <View style={[styles.actionColumn, styles.rowActions]}>
                    <TouchableOpacity
                      onPress={() => handleEditItem(item)}
                      className="p-1.5"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      className="p-1.5"
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

      {/* Bound structural link via forward ref connection 👇 */}
      <DonatedItemModal
        ref={sheetRef}
        onClose={() => setEditingItem(null)}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        initialData={editingItem}
        isEditing={!!editingItem}
      />
    </View>
  );
};

// Only the column widths/cell base styles remain here — the header row
// looks these up dynamically via a computed key (styles[`${h}Column`]),
// which a className string can't represent, so they stay as StyleSheet
// objects rather than being converted.
const styles = StyleSheet.create({
  cellText: { fontSize: 13, paddingHorizontal: 10 },
  headerCell: { fontWeight: "600" },
  bodyCell: { fontWeight: "400" },
  cellCenter: { alignItems: "center", justifyContent: "center" },
  productColumn: { width: 140 },
  qtyColumn: { width: 60 },
  batchColumn: { width: 90 },
  expiryColumn: { width: 100, paddingHorizontal: 10, gap: 2 },
  statusColumn: { width: 70 },
  activeColumn: { width: 70 },
  actionColumn: { width: 80 },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default DonatedItemsTable;
