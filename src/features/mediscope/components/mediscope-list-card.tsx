import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";

interface MediscopeListCardProps {
  item: MediscopeCardData;
  onPress?: (item: MediscopeCardData) => void;
  // The home feed only ever includes already-published items (see
  // fullFeed's own filtering in app/(tabs)/index.tsx), so a status
  // badge that would always read "Published" there conveys nothing —
  // it's only actually informative on screens that can show a mix of
  // statuses (the owner's own list, search results, etc).
  showStatus?: boolean;
  // Defaults to false — response count is competitive information (how
  // many facilities have already responded) that should only be visible
  // to the request's own creator, not to other facilities deciding
  // whether to respond.
  showResponseCount?: boolean;
}

const STATUS_META: Record<
  MediscopeCardData["status"],
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  draft: { label: "Draft", icon: "file-outline", tone: "info" },
  published: { label: "Published", icon: "eye-outline", tone: "success" },
  fulfilled: { label: "Fulfilled", icon: "trophy-outline", tone: "success" },
  closed: { label: "Closed", icon: "lock-outline", tone: "warning" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
  expired: { label: "Expired", icon: "clock-alert-outline", tone: "error" },
};

const MediscopeListCard: React.FC<MediscopeListCardProps> = ({ item, onPress, showStatus = true, showResponseCount = false }) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[item.status];
  const statusColor = colors[statusMeta.tone];

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
        {item.imageUrl ? (
          <LoadingImage source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12 }} />
        ) : (
          <View className="w-11 h-11 rounded-xl justify-center items-center" style={{ backgroundColor: colors.secondary + "18" }}>
            <MaterialCommunityIcons name="pill" size={20} color={colors.secondary} />
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text numberOfLines={1} className="text-[15px] font-bold" style={{ color: colors.text }}>
            {item.product}
          </Text>
          <Text className="text-xs mt-px" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {item.facilityName} · {item.facilityLocation}
          </Text>
        </View>

        {showStatus && (
          <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: statusColor + "18" }}>
            <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
            <Text className="text-[10px] font-bold" style={{ color: statusColor }}>{statusMeta.label}</Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center mt-3 ml-14">
        {showResponseCount ? (
          <View className="flex-row items-center px-2 py-1 rounded-lg gap-1" style={{ backgroundColor: colors.info + "14" }}>
            <MaterialCommunityIcons name="reply-all-outline" size={12} color={colors.info} />
            <Text className="text-[11px] font-bold" style={{ color: colors.info }}>
              {item.responseCount} {item.responseCount === 1 ? "response" : "responses"}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
          {format(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(MediscopeListCard);

