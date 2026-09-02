import React from "react";
import { Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface HorizontalRequestCardProps {
  item: RxRfqCardData;
  onPress?: (item: RxRfqCardData) => void;
  accentColor?: string;
}

export const HorizontalRequestCard = ({
  item,
  onPress,
  accentColor,
}: HorizontalRequestCardProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`w-[230px] rounded-[18px] border-[0.5px] mr-3 overflow-hidden active:opacity-75 ${
        onPress ? "cursor-pointer hover:opacity-90" : ""
      }`}
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      {/* Accent bar */}
      <View
        className="h-1"
        style={{ backgroundColor: accentColor || colors.backgroundSecondary }}
      />

      {/* Header */}
      <View className="px-3.5 pt-3.5 pb-1 gap-0.5">
        <Text className="text-[15px] font-medium" style={{ color: colors.text }} numberOfLines={1}>
          {item.facilityName}
        </Text>
        <Text
          className="text-[13px]"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          {item.facilityLocation}
        </Text>
      </View>

      {/* Meta row: published time + product count */}
      <View className="flex-row justify-between items-center px-3.5 py-2">
        <View className="flex-row items-center gap-[5px]">
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color="#16a34a"
          />
          <Text className="text-xs" style={{ color: colors.textSecondary, ...noSelectStyle }}>
            {format(item.publishedAt)}
          </Text>
        </View>
        <View
          className="flex-row items-center gap-1 rounded-full border-[0.5px] px-2.5 py-[3px]"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons
            name="pill"
            size={13}
            color={colors.textSecondary}
          />
          <Text className="text-xs font-medium" style={{ color: colors.text, ...noSelectStyle }}>
            {item.productCount}
          </Text>
        </View>
      </View>

      {/* Deadline strip */}
      <View
        className="flex-row items-center gap-[5px] mx-2.5 mb-2.5 rounded-[10px] px-2.5 py-[5px]"
        style={{ backgroundColor: colors.warning + "10" }}
      >
        <Ionicons name="hourglass-outline" size={13} color={colors.warning} />
        <Text className="text-xs" style={{ color: colors.warning, ...noSelectStyle }}>
          {format(item.submissionDeadline)}
        </Text>
      </View>
    </Pressable>
  );
};

