import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqCardData, RxRfqStatusType } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqCardProps {
  rfq: RxRfqCardData;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const STATUS_META: Record<
  RxRfqStatusType,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  draft: { label: "Draft", icon: "file-outline", tone: "info" },
  published: { label: "Published", icon: "eye-outline", tone: "success" },
  closed: { label: "Closed", icon: "lock-outline", tone: "warning" },
  awarded: { label: "Awarded", icon: "trophy-outline", tone: "success" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
  expired: { label: "Expired", icon: "clock-alert-outline", tone: "error" },
};

const RxRfqCard: React.FC<RxRfqCardProps> = ({
  rfq,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[rfq.status];
  const statusColor = colors[statusMeta.tone];

  const formatDate = (dateString: Date | string): string => {
    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return String(dateString);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
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
          <MaterialCommunityIcons name="hospital-building" size={20} color={colors.primary} />
        </View>

        <View className="flex-1 ml-3">
          <Text numberOfLines={1} className="text-[15px] font-bold" style={{ color: colors.text }}>
            {rfq.facilityName}
          </Text>
          <Text className="text-[11px] mt-px" style={{ color: colors.textSecondary }}>{rfq.code}</Text>
        </View>

        <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: statusColor + "18" }}>
          <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
          <Text className="text-[10px] font-bold" style={{ color: statusColor }}>{statusMeta.label}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1 mt-2.5 ml-[52px]">
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
        <Text numberOfLines={1} className="flex-1 text-xs" style={{ color: colors.textSecondary }}>
          {rfq.facilityLocation}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mt-3 ml-[52px]">
        <View className="flex-row items-center gap-1.5 flex-wrap flex-1">
          <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.info + "14" }}>
            <MaterialCommunityIcons name="pill" size={12} color={colors.info} />
            <Text className="text-[11px] font-bold" style={{ color: colors.info }}>
              {rfq.productCount} {rfq.productCount === 1 ? "item" : "items"}
            </Text>
          </View>

          <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.warning + "14" }}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.warning} />
            <Text className="text-[11px] font-bold" style={{ color: colors.warning }}>
              {formatDate(rfq.submissionDeadline)}
            </Text>
          </View>

          {rfq.responseCount > 0 && (
            <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.success + "14" }}>
              <MaterialCommunityIcons name="reply-all-outline" size={12} color={colors.success} />
              <Text className="text-[11px] font-bold" style={{ color: colors.success }}>
                {rfq.responseCount}
              </Text>
            </View>
          )}
        </View>

        {showActions && (onEdit || onDelete) ? (
          <View className="flex-row items-center">
            {onEdit && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 ml-2"
              >
                <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 ml-2"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
            {format(rfq.publishedAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default RxRfqCard;

