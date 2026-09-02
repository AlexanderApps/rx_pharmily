import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface RequestItem {
  id: string | number;
  medication: string;
  strength: string;
  location?: string;
  status: "responses" | "awaiting" | string;
  responses?: number | string;
  time: string;
}

interface RequestCardRowProps {
  item: RequestItem;
  isLastItem: boolean;
  onPress?: (item: RequestItem) => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
    backgroundElement: string;
    secondary: string;
  };
}

export const RequestCardRow = ({
  item,
  isLastItem,
  onPress,
  iconName = "pill",
  colors,
}: RequestCardRowProps) => {
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="p-4"
      style={!isLastItem ? { borderBottomColor: colors.border, borderBottomWidth: 0.5 } : undefined}
    >
      <View className="flex-row items-start">
        {/* Left Icon Block */}
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

        {/* Middle Metadata Block */}
        <View className="flex-1 ml-3">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {item.medication}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
            {item.strength}
          </Text>
          <View className="flex-row items-center mt-1.5">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              className="text-[13px] ml-1"
              style={{ color: colors.textSecondary }}
            >
              {item.location || "Accra, Greater Accra"}
            </Text>
          </View>
        </View>

        {/* Right Status Block */}
        <View className="items-end justify-between min-h-12">
          {item.status === "responses" ? (
            <View className="px-3 py-1 rounded-full bg-[#DCFCE7]">
              <Text className="text-xs font-semibold text-[#15803D]">
                {item.responses} Responses
              </Text>
            </View>
          ) : (
            <View className="px-3 py-1 rounded-full bg-[#DBEAFE]">
              <Text className="text-xs font-semibold text-[#2563EB]">Awaiting</Text>
            </View>
          )}
          <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            {item.time}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

