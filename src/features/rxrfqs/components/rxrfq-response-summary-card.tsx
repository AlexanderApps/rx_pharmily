import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqResponseCardData } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqResponseSummaryCardProps {
  response: RxRfqResponseCardData;
  currency: string;
  isAwarded?: boolean;
  onPress: () => void;
}

const fmtDate = (d?: Date) =>
  d
    ? d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const RxRfqResponseSummaryCard: React.FC<RxRfqResponseSummaryCardProps> = ({
  response,
  currency,
  isAwarded = false,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="flex-row items-center rounded-xl p-3 gap-2.5"
      style={{
        backgroundColor: colors.backgroundElement,
        borderColor: isAwarded ? colors.success : colors.border,
        borderWidth: isAwarded ? 2 : 1,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-1 flex-row items-center gap-2.5">
        <View
          className="w-9 h-9 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons
            name="storefront-outline"
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            className="text-sm font-medium"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {response.vendorFacility}
          </Text>
          <Text
            className="text-[11px] mt-0.5"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {response.submittedAt
              ? `Submitted ${fmtDate(response.submittedAt)}`
              : "Draft response"}
            {"  ·  Delivery "}
            {fmtDate(response.estimatedDeliveryDate)}
          </Text>
        </View>
      </View>

      <View className="items-end gap-0.5">
        {isAwarded && (
          <View
            className="flex-row items-center gap-[3px] px-1.5 py-0.5 rounded-md mb-0.5"
            style={{ backgroundColor: colors.success + "18" }}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={12}
              color={colors.success}
            />
            <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
              Awarded
            </Text>
          </View>
        )}
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
          {currency}{" "}
          {response.grandTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        {response.totalOptionalCosts > 0 && (
          <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
            +{currency}{" "}
            {response.totalOptionalCosts.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            optional
          </Text>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

export default RxRfqResponseSummaryCard;

