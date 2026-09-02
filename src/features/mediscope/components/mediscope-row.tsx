import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";
import LoadingImage from "@/shared/components/loading-image";

interface MediscopeRowProps {
  item: MediscopeCardData;
  isLastItem: boolean;
  onPress?: (item: MediscopeCardData) => void;
}

const STATUS_COLOR_KEY: Record<MediscopeCardData["status"], "success" | "warning" | "error" | "info"> = {
  draft: "info",
  published: "success",
  fulfilled: "success",
  closed: "warning",
  cancelled: "error",
  expired: "error",
};

export const MediscopeRow = ({ item, isLastItem, onPress }: MediscopeRowProps) => {
  const { colors } = useTheme();
  const statusColor = colors[STATUS_COLOR_KEY[item.status]];

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`p-4 active:opacity-70 ${onPress ? "cursor-pointer hover:opacity-90" : ""}`}
      style={!isLastItem ? { borderBottomWidth: 0.5, borderBottomColor: colors.border } : undefined}
    >
      <View className="flex-row items-start">
        {item.imageUrl ? (
          <LoadingImage source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
        ) : (
          <View className="w-12 h-12 rounded-xl justify-center items-center" style={{ backgroundColor: colors.backgroundElement }}>
            <MaterialCommunityIcons name="pill" size={22} color={colors.secondary} />
          </View>
        )}

        <View className="flex-1 ml-3 gap-0.5">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {item.product}
          </Text>
          <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {item.facilityName} · {item.facilityLocation}
          </Text>
        </View>

        <View className="items-end justify-between min-h-12">
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: statusColor + "20" }}>
            <Text className="text-[11px] font-bold capitalize" style={{ color: statusColor, ...noSelectStyle }}>{item.status}</Text>
          </View>
          <Text className="text-xs" style={{ color: colors.textSecondary, ...noSelectStyle }}>
            {format(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

