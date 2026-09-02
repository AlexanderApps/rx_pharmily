import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { Job } from "@/features/rxjobs/types/rxjobs.types";

interface JobListCardProps {
  item: Job;
  onPress?: (item: Job) => void;
}

const JobListCard: React.FC<JobListCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isImmediate = item.urgency === "Immediate";
  const urgencyColor = isImmediate ? colors.error : colors.info;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      className="rounded-[18px] p-4"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl justify-center items-center" style={{ backgroundColor: colors.primary + "18" }}>
          <Text className="text-xs font-extrabold" style={{ color: colors.primary }}>{item.companyLogo}</Text>
        </View>

        <View className="flex-1 ml-3">
          <Text numberOfLines={1} className="text-[15px] font-bold" style={{ color: colors.text }}>
            {item.title}
          </Text>
          <Text className="text-xs mt-px" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {item.companyName}
          </Text>
        </View>

        <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: urgencyColor + "18" }}>
          <MaterialCommunityIcons
            name={isImmediate ? "lightning-bolt-outline" : "calendar-outline"}
            size={11}
            color={urgencyColor}
          />
          <Text className="text-[10px] font-bold" style={{ color: urgencyColor }}>{item.urgency}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1 mt-2.5 ml-[52px]">
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
        <Text numberOfLines={1} className="flex-1 text-xs" style={{ color: colors.textSecondary }}>
          {item.location}
        </Text>
      </View>

      <View className="mt-3 ml-[52px]">
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.secondary + "14", maxWidth: 170 }}>
            <MaterialCommunityIcons name="briefcase-outline" size={12} color={colors.secondary} />
            <Text className="text-[11px] font-bold" style={{ color: colors.secondary }} numberOfLines={1}>
              {item.jobType}
            </Text>
          </View>

          <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.success + "14", maxWidth: 170 }}>
            <MaterialCommunityIcons name="cash-multiple" size={12} color={colors.success} />
            <Text className="text-[11px] font-bold" style={{ color: colors.success }} numberOfLines={1}>
              {item.salaryRange}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2.5 ml-[52px]">
        <View className="flex-row items-center gap-1">
          {item.postedBy === currentUserId && (
            <>
              <MaterialCommunityIcons name="account-group-outline" size={12} color={colors.textSecondary} />
              <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                {item.applicantsCount} applicants
              </Text>
            </>
          )}
        </View>
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
          {format(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default JobListCard;

