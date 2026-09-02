import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { ConsultRequest, ConsultStatus } from "@/features/help/types/help.types";

interface ConsultRequestCardProps {
  request: ConsultRequest;
  onPress?: () => void;
}

const STATUS_META: Record<
  ConsultStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  pending: { label: "Pending", icon: "clock-outline", tone: "warning" },
  accepted: { label: "Accepted", icon: "calendar-check-outline", tone: "info" },
  completed: { label: "Completed", icon: "check-circle-outline", tone: "success" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
};

const ConsultRequestCard: React.FC<ConsultRequestCardProps> = ({ request, onPress }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[request.status];
  const toneColor = colors[meta.tone];

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-3.5 gap-2"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-[10px] items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
          <MaterialCommunityIcons name="account-tie-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {request.subject}
          </Text>
          <Text className="text-[11px] mt-px" style={{ color: colors.textSecondary }}>{request.category}</Text>
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: toneColor + "18" }}>
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text className="text-[10px] font-bold" style={{ color: toneColor }}>{meta.label}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center ml-[46px]">
        {request.consultantName && (
          <Text className="text-xs flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
            with {request.consultantName}
          </Text>
        )}
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>{format(request.createdAt)}</Text>
      </View>
    </Pressable>
  );
};

export default ConsultRequestCard;

