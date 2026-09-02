import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatAmount } from "@/shared/utils/format";
import { MediscopeResponse } from "@/features/mediscope/types/mediscope.types";

interface MediscopeResponseCardProps {
  response: MediscopeResponse;
  isFulfilled?: boolean;
}

const MediscopeResponseCard: React.FC<MediscopeResponseCardProps> = ({
  response,
  isFulfilled = false,
}) => {
  const { colors } = useTheme();
  const isFull = response.availability === "full";

  return (
    <View
      className="rounded-xl border p-3 gap-1.5"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: isFulfilled ? colors.success : colors.border,
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
          {response.vendorFacility}
        </Text>
        <View
          className="flex-row items-center gap-1 px-2 py-[3px] rounded-md"
          style={{ backgroundColor: (isFull ? colors.success : colors.warning) + "20" }}
        >
          <MaterialCommunityIcons
            name={isFull ? "check-circle-outline" : "circle-half-full"}
            size={12}
            color={isFull ? colors.success : colors.warning}
          />
          <Text className="text-[10px] font-bold" style={{ color: isFull ? colors.success : colors.warning }}>
            {isFull ? "Fully available" : "Partial"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5">
        <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSecondary} />
        <Text className="text-xs flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {response.facilityWhereAvailable}
        </Text>
      </View>

      {response.comment ? (
        <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary }}>{response.comment}</Text>
      ) : null}

      <View className="flex-row justify-between items-center mt-0.5">
        <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
          {response.currency} {formatAmount(response.cost)}
        </Text>
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
          {format(response.createdAt)}
        </Text>
      </View>

      {isFulfilled && (
        <View className="flex-row items-center gap-1.5 rounded-lg px-2 py-1.5 mt-0.5" style={{ backgroundColor: colors.success + "18" }}>
          <MaterialCommunityIcons name="trophy-outline" size={13} color={colors.success} />
          <Text className="text-[11px] font-semibold" style={{ color: colors.success }}>
            Selected as the fulfilling response
          </Text>
        </View>
      )}
    </View>
  );
};

export default MediscopeResponseCard;

