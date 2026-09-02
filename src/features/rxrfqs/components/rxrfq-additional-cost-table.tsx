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
    <View className="w-full gap-3">
      {/* Header row */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
          {items.length > 0
            ? `${items.length} cost${items.length > 1 ? "s" : ""} added`
            : "No additional costs"}
        </Text>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-3 py-[7px] rounded-lg"
          style={{ backgroundColor: colors.text }}
          onPress={openAdd}
        >
          <MaterialCommunityIcons
            name="plus"
            size={15}
            color={colors.backgroundSecondary}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: colors.backgroundSecondary }}
          >
            Add Cost
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text className="text-xs font-medium" style={{ color: colors.error }}>{error}</Text>
      )}

      {items.length === 0 ? (
        <View
          className="items-center justify-center py-8 px-5 rounded-xl border border-dashed gap-1"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons
            name="cash-plus"
            size={40}
            color={colors.textSecondary}
          />
          <Text className="text-[15px] font-semibold mt-2" style={{ color: colors.text }}>
            No additional costs
          </Text>
          <Text className="text-[13px] text-center" style={{ color: colors.textSecondary }}>
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
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
            )}
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
            renderItem={({ item }) => {
              const meta = COST_TYPE_META[item.costType];
              return (
                <View className="flex-row items-center px-3.5 py-3 gap-3">
                  {/* Left: icon + text */}
                  <View
                    className="w-9 h-9 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.backgroundSecondary }}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="text-sm font-medium flex-1"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                      {item.isRequired && (
                        <View
                          className="px-[7px] py-0.5 rounded-md"
                          style={{ backgroundColor: colors.error + "18" }}
                        >
                          <Text
                            className="text-[11px] font-semibold"
                            style={{ color: colors.error }}
                          >
                            Required
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {meta.label}
                    </Text>
                  </View>

                  {/* Right: amount + actions */}
                  <View className="items-end gap-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    <View className="flex-row gap-0.5">
                      <TouchableOpacity
                        onPress={() => openEdit(item)}
                        className="p-1 mx-0.5"
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        className="p-1 mx-0.5"
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
            className="flex-row justify-between items-center px-3.5 py-3 rounded-xl border"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              Additional costs total ({currency})
            </Text>
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
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
        currency={currency}
      />
    </View>
  );
};

export default RxRfqAdditionalCostsTable;

