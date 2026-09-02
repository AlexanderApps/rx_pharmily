import React from "react";
import { Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface JobRowProps {
  item: Job;
  isLastItem: boolean;
  onPress?: (item: Job) => void;
}

export const JobRow = ({ item, isLastItem, onPress }: JobRowProps) => {
  const { colors } = useTheme();
  const isImmediate = item.urgency === "Immediate";

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
          <Text className="text-[13px] font-bold" style={{ color: colors.text, ...noSelectStyle }}>
            {item.companyLogo}
          </Text>
        </View>

        <View className="flex-1 ml-3 gap-0.5">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            className="text-[13px]"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.companyName}
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
            className="px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isImmediate
                ? colors.error + "20"
                : colors.info + "20",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: isImmediate ? colors.error : colors.info, ...noSelectStyle }}
            >
              {item.urgency}
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

