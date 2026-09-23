import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
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

  // The wide, desktop-sized columns only apply once there's actually
  // room for them — a narrow browser window or mobile web view gets the
  // same compact sizing the native app already uses at any screen size,
  // rather than the desktop widths regardless of how little space is
  // actually available. useBreakpoint (not a bare Platform.OS check)
  // is what makes this reactive to the window actually being resized,
  // not just which platform the app happens to be running on.
  const breakpoint = useBreakpoint();
  const isWideLayout = Platform.OS === "web" && breakpoint !== "compact";

  const COLS = {
    product: isWideLayout ? 320 : 180,
    qty: isWideLayout ? 90 : 50,
    uom: isWideLayout ? 100 : 60,
    alt: isWideLayout ? 130 : 50,
    comment: isWideLayout ? 110 : 40,
    actions: isWideLayout ? 100 : 70,
  };
  const CELL_TEXT = isWideLayout ? "text-sm" : "text-xs";
  const CELL_PADDING = isWideLayout ? "px-3" : "px-1.5";
  const ROW_HEIGHT = isWideLayout ? "min-h-16" : "min-h-12";
  const ICON_SIZE = isWideLayout ? 20 : 16;
  const BADGE_ICON_SIZE = isWideLayout ? 14 : 12;

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

  return (
    <View className="w-full">
      {items.length > 0 && (
        <TouchableOpacity
          className="flex-row items-center self-end gap-1.5 px-3 py-2 rounded-lg mb-3"
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
            Add RxRfQ items to continue
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
          keyboardShouldPersistTaps="handled"
          className="w-full"
        >
          <View
            className="border rounded-[10px] overflow-hidden"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View
              className="flex-row border-b py-2.5"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold`}
                style={{ color: colors.text, width: COLS.product }}
              >
                Product
              </Text>

              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold text-center`}
                style={{ color: colors.text, width: COLS.qty }}
              >
                Qty
              </Text>

              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold text-center`}
                style={{ color: colors.text, width: COLS.uom }}
              >
                UOM
              </Text>

              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold text-center`}
                style={{ color: colors.text, width: COLS.alt }}
              >
                {isWideLayout ? "Alternatives" : "Alt"}
              </Text>

              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold text-center`}
                style={{ color: colors.text, width: COLS.comment }}
              >
                {isWideLayout ? "Comment" : "Cmt"}
              </Text>

              <Text
                className={`${CELL_TEXT} ${CELL_PADDING} font-semibold text-center`}
                style={{ color: colors.text, width: COLS.actions }}
              >
                Actions
              </Text>
            </View>

            {/* Rows */}
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View
                  className={`flex-row items-center ${ROW_HEIGHT}`}
                  style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
                >
                  <Text
                    className={`${CELL_TEXT} ${CELL_PADDING} font-normal`}
                    style={{ color: colors.text, width: COLS.product }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getProductName(item.productId)}
                  </Text>

                  <Text
                    className={`${CELL_TEXT} ${CELL_PADDING} font-normal text-center`}
                    style={{ color: colors.text, width: COLS.qty }}
                  >
                    {item.quantity}
                  </Text>

                  <Text
                    className={`${CELL_TEXT} ${CELL_PADDING} font-normal text-center`}
                    style={{ color: colors.text, width: COLS.uom }}
                    numberOfLines={1}
                  >
                    {item.uom || "-"}
                  </Text>

                  <View className="items-center justify-center" style={{ width: COLS.alt }}>
                    <View
                      className="p-1 rounded-md"
                      style={{
                        backgroundColor: item.allowAlternatives
                          ? colors.success + "20"
                          : colors.error + "20",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.allowAlternatives ? "check" : "close"}
                        size={BADGE_ICON_SIZE}
                        color={
                          item.allowAlternatives ? colors.success : colors.error
                        }
                      />
                    </View>
                  </View>

                  <Text
                    className={`${CELL_TEXT} ${CELL_PADDING} font-normal text-center`}
                    style={{ color: colors.textSecondary, width: COLS.comment }}
                  >
                    {item.comment?.trim() ? "..." : "-"}
                  </Text>

                  <View className="flex-row items-center justify-center gap-0.5" style={{ width: COLS.actions }}>
                    <TouchableOpacity
                      onPress={() => handleEditItem(item)}
                      className="p-1 mx-1"
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={ICON_SIZE}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      className="p-1 mx-1"
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={ICON_SIZE}
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

export default RxRfQItemsTable;
