import React from "react";
import { Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface JobHsCardProps {
  item: Job;
  onPress?: (item: Job) => void;
}

export const JobHsCard = ({ item, onPress }: JobHsCardProps) => {
  const { colors } = useTheme();
  const isImmediate = item.urgency === "Immediate";

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className={`w-60 rounded-[18px] border-[0.5px] mr-3 overflow-hidden active:opacity-75 ${
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
          backgroundColor: isImmediate ? colors.error : colors.primary,
        }}
      />

      <View className="px-3.5 pt-3 pb-1.5 gap-1.5">
        <View className="flex-row items-center justify-between">
          <View
            className="w-[34px] h-[34px] rounded-[9px] items-center justify-center"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: colors.text, ...noSelectStyle }}
            >
              {item.companyLogo}
            </Text>
          </View>
          <View>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: colors.textSecondary }}
            >
              {item.jobType}
            </Text>
          </View>
        </View>

        <Text
          className="text-sm font-semibold mt-1"
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          {item.companyName}
        </Text>
      </View>

      <View className="px-3.5 pb-2 gap-1">
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary, ...noSelectStyle }}
          >
            {format(item.createdAt)}
          </Text>
        </View>
      </View>

      <View
        className="flex-row items-center gap-1.5 mx-2.5 mb-2.5 rounded-[10px] px-2.5 py-1.5"
        style={{ backgroundColor: colors.success + "10" }}
      >
        <MaterialCommunityIcons
          name="cash-multiple"
          size={13}
          color={colors.success}
        />
        <Text
          className="text-[11px] font-semibold flex-1"
          style={{ color: colors.success }}
          numberOfLines={1}
        >
          {item.salaryRange}
        </Text>
      </View>
    </Pressable>
  );
};