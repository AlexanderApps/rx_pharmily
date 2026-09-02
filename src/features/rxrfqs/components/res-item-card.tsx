import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

export interface RxRfqResponseItem {
  id: string;
  rfqItemId: string;
  product: string;
  quantity: number;
  rate: number;
  amount: number;
  offeredAlternative: boolean;
  alternativeProductDetails?: string;
  comment?: string;
}

interface ResponseItemCardProps {
  item: RxRfqResponseItem;
  onPress?: (item: RxRfqResponseItem) => void;
}

export const ResponseItemCard = ({ item, onPress }: ResponseItemCardProps) => {
  const { colors } = useTheme();

  // Format currency values neatly
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="rounded-xl border p-4 my-1.5"
      style={({ pressed }) => ({
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        opacity: pressed ? 0.7 : 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      })}
    >
      {/* Product Title Section */}
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center flex-1 gap-2">
          <Text
            className="text-base font-semibold flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {item.product}
          </Text>
          {item.offeredAlternative && (
            <View
              className="px-2 py-[3px] rounded-md"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <Text className="text-[11px] font-bold uppercase" style={{ color: colors.text }}>
                Alternative
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Alternative Details Warning Banner if offeredAlternative is true */}
      {item.offeredAlternative && item.alternativeProductDetails && (
        <View
          className="flex-row items-center p-2.5 rounded-lg gap-1.5 mb-3"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            className="text-[13px] flex-1 italic"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {item.alternativeProductDetails}
          </Text>
        </View>
      )}

      {/* Numerical Metrics Matrix Grid */}
      <View className="flex-row justify-between items-center">
        <View className="flex-col">
          <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>
            Qty
          </Text>
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {item.quantity}
          </Text>
        </View>

        <View className="flex-col">
          <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>
            Rate
          </Text>
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {formatCurrency(item.rate)}
          </Text>
        </View>

        <View className="flex-col items-end">
          <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>
            Total Amount
          </Text>
          <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      {/* Bottom Context Comment Area */}
      {item.comment && item.comment.trim().length > 0 && (
        <View
          className="flex-row items-start border-t-[0.5px] mt-3 pt-2.5 gap-1.5"
          style={{ borderTopColor: colors.border }}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            className="text-xs flex-1 leading-4"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {item.comment}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

