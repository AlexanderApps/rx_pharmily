import React from "react";
import { Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface DonationHsCardProps {
  item: DonationCardData;
  onPress?: (item: DonationCardData) => void;
}

export const DonationHsCard = ({ item, onPress }: DonationHsCardProps) => {
  const { colors } = useTheme();
  const isOpened = item.status === "opened";

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`w-[220px] rounded-[18px] border-[0.5px] mr-3 overflow-hidden active:opacity-75 ${
        onPress ? "cursor-pointer hover:opacity-90" : ""
      }`}
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      <View
        className="h-1"
        style={{
          backgroundColor: isOpened
            ? colors.success
            : colors.backgroundSecondary,
        }}
      />

      <View className="px-3.5 pt-3.5 pb-1 gap-0.5">
        <Text
          className="text-[15px] font-medium"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {item.facilityName}
        </Text>
        <Text
          className="text-[13px]"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          {item.location}
        </Text>
      </View>

      <View className="flex-row justify-between items-center px-3.5 py-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text
            className="text-xs"
            style={{ color: colors.textSecondary, ...noSelectStyle }}
          >
            {format(item.createdAt)}
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
            name="package-variant-closed"
            size={13}
            color={colors.textSecondary}
          />
          <Text
            className="text-xs font-medium"
            style={{ color: colors.text, ...noSelectStyle }}
          >
            {item.itemCount}
          </Text>
        </View>
      </View>

      <View
        className="flex-row items-center gap-1.5 mx-2.5 mb-2.5 rounded-[10px] px-2.5 py-1.5"
        style={{
          backgroundColor:
            (isOpened ? colors.success : colors.textSecondary) + "10",
        }}
      >
        <MaterialCommunityIcons
          name={isOpened ? "eye-outline" : "eye-off-outline"}
          size={13}
          color={isOpened ? colors.success : colors.textSecondary}
        />
        <Text
          className="text-xs capitalize"
          style={{
            color: isOpened ? colors.success : colors.textSecondary,
            ...noSelectStyle,
          }}
        >
          {item.status}
        </Text>
      </View>
    </Pressable>
  );
};