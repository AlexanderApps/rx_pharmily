import React from "react";
import { Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";
import LoadingImage from "@/shared/components/loading-image";
import MediscopeNamePlaceholder from "@/features/mediscope/components/mediscope-name-placeholder";

interface MediscopeHsCardProps {
  item: MediscopeCardData;
  onPress?: (item: MediscopeCardData) => void;
}

const CARD_HEIGHT = 210;
const IMAGE_HEIGHT = 126; // ~60%
const DETAILS_HEIGHT = 84; // ~40%

export const MediscopeHsCard = ({ item, onPress }: MediscopeHsCardProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`mr-3 w-[200px] overflow-hidden rounded-[18px] border active:opacity-75 ${
        onPress ? "cursor-pointer hover:opacity-90" : ""
      }`}
      style={{
        height: CARD_HEIGHT,
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      {/* Image — ~60% */}
      {item.imageUrl ? (
        <LoadingImage
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", height: IMAGE_HEIGHT }}
          resizeMode="cover"
        />
      ) : (
        <MediscopeNamePlaceholder
          product={item.product}
          style={{ width: "100%", height: IMAGE_HEIGHT }}
          fontSize={13}
        />
      )}

      {/* Details — ~40% */}
      <View
        className="justify-between px-3.5 py-2"
        style={{ height: DETAILS_HEIGHT }}
      >
        <View className="gap-0.5">
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {item.product}
          </Text>
          <Text
            className="text-xs"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.facilityName}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text className="text-[11px]" style={{ color: colors.textSecondary, ...noSelectStyle }}>
              {format(item.createdAt)}
            </Text>
          </View>

          <View
            className="flex-row items-center gap-1 rounded-full border px-2.5 py-0.5"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              borderWidth: 0.5,
            }}
          >
            <MaterialCommunityIcons
              name="reply-all-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text className="text-[11px] font-medium" style={{ color: colors.text, ...noSelectStyle }}>
              {item.responseCount}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};