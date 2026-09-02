import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface DonationRowProps {
  item: DonationCardData;
  isLastItem: boolean;
  onPress?: (item: DonationCardData) => void;
}

const STATUS_META: Record<
  DonationCardData["status"],
  { icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  opened: { icon: "eye-outline" },
  hidden: { icon: "eye-off-outline" },
  closed: { icon: "lock-outline" },
};

export const DonationRow = ({ item, isLastItem, onPress }: DonationRowProps) => {
  const { colors } = useTheme();
  const isOpened = item.status === "opened";

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`p-4 active:opacity-70 ${onPress ? "cursor-pointer hover:opacity-90" : ""}`}
      style={!isLastItem ? { borderBottomWidth: 0.5, borderBottomColor: colors.border } : undefined}
    >
      <View className="flex-row items-start">
        <View
          className="w-12 h-12 rounded-xl justify-center items-center"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons
            name="hand-heart-outline"
            size={22}
            color={colors.secondary}
          />
        </View>

        <View className="flex-1 ml-3 gap-0.5">
          <Text className="text-[15px] font-medium" style={{ color: colors.text }} numberOfLines={1}>
            {item.facilityName}
          </Text>
          <Text
            className="text-[13px]"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
          </Text>
          <View className="flex-row items-center gap-1 mt-1">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              className="text-[13px]"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
        </View>

        <View className="items-end justify-between min-h-12">
          <View
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isOpened
                ? colors.success + "20"
                : colors.backgroundElement,
            }}
          >
            <MaterialCommunityIcons
              name={STATUS_META[item.status].icon}
              size={12}
              color={isOpened ? colors.success : colors.textSecondary}
            />
            <Text
              className="text-[11px] font-medium capitalize"
              style={{ color: isOpened ? colors.success : colors.textSecondary, ...noSelectStyle }}
            >
              {item.status}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: colors.textSecondary, ...noSelectStyle }}>
            {format(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

