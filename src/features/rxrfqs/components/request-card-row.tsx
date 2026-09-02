import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface RequestCardRowProps {
  item: RxRfqCardData;
  isLastItem: boolean;
  onPress?: (item: RxRfqCardData) => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const RequestCardRow = ({
  item,
  isLastItem,
  onPress,
  iconName = "office-building",
}: RequestCardRowProps) => {
  const { colors } = useTheme();
  const hasResponses = item.responseCount > 0;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`p-4 active:opacity-70 ${onPress ? "cursor-pointer hover:opacity-90" : ""}`}
      style={
        !isLastItem
          ? { borderBottomWidth: 0.5, borderBottomColor: colors.border }
          : undefined
      }
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className="w-12 h-12 rounded-xl justify-center items-center"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={22}
            color={colors.secondary}
          />
        </View>

        {/* Meta */}
        <View className="flex-1 ml-3 gap-0.5">
          <Text className="text-[15px] font-medium" style={{ color: colors.text }} numberOfLines={1}>
            {item.facilityName}
          </Text>
          <Text
            className="text-[13px]"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.code}
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
              {item.facilityLocation}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View className="items-end justify-between min-h-12">
          <View
            className="px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: hasResponses
                ? colors.success + "20"
                : colors.info + "20",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: hasResponses ? colors.success : colors.info, ...noSelectStyle }}
            >
              {hasResponses ? `${item.responseCount} responses` : "Awaiting"}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: colors.textSecondary, ...noSelectStyle }}>
            {format(item.publishedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

