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
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
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
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            No items added yet
          </Text>
          <Text
            style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}
          >
            Add donated items to continue
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
            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
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
                        style={[
                          styles.expiryTag,
                          { color: getExpiryColor(item.expiryDate, colors) },
                        ]}
                      >
                        {getExpiryLabel(item.expiryDate)}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusColumn, styles.cellCenter]}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.status
                            ? colors.success + "20"
                            : colors.error + "20",
                        },
                      ]}
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
                      style={[
                        styles.activeBadge,
                        {
                          backgroundColor: item.isActive
                            ? colors.success + "20"
                            : colors.error + "20",
                        },
                      ]}
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

const styles = StyleSheet.create({
  container: { width: "100%" },
  addInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  addInlineButtonText: { fontSize: 13, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyStateText: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: { fontSize: 14, fontWeight: "600" },
  error: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  tableScroll: { width: "100%" },
  tableContainer: { borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    paddingVertical: 12,
    alignItems: "center",
  },
  cellText: { fontSize: 13, paddingHorizontal: 10 },
  headerCell: { fontWeight: "600" },
  bodyCell: { fontWeight: "400" },
  cellCenter: { alignItems: "center", justifyContent: "center" },
  productColumn: { width: 140 },
  qtyColumn: { width: 60 },
  batchColumn: { width: 90 },
  expiryColumn: { width: 100, paddingHorizontal: 10, gap: 2 },
  expiryTag: { fontSize: 10, fontWeight: "700" },
  statusColumn: { width: 70 },
  activeColumn: { width: 70 },
  actionColumn: { width: 80 },
  statusBadge: { padding: 4, borderRadius: 6 },
  activeBadge: { padding: 4, borderRadius: 6 },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionIconButton: { padding: 6 },
});

export default DonatedItemsTable;
