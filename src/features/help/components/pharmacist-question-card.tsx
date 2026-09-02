import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { PharmacistQuestion, PharmacistQuestionStatus } from "@/features/help/types/help.types";

interface PharmacistQuestionCardProps {
  item: PharmacistQuestion;
  onPress?: () => void;
}

const STATUS_META: Record<
  PharmacistQuestionStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "info" }
> = {
  pending: { label: "Awaiting reply", icon: "clock-outline", tone: "warning" },
  answered: { label: "Answered", icon: "check-circle-outline", tone: "success" },
  closed: { label: "Closed", icon: "archive-outline", tone: "info" },
};

const PharmacistQuestionCard: React.FC<PharmacistQuestionCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[item.status];
  const toneColor = colors[meta.tone];

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-3.5 gap-2.5"
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
      <View className="flex-row items-start gap-2.5">
        <View className="w-9 h-9 rounded-[10px] items-center justify-center" style={{ backgroundColor: colors.secondary + "18" }}>
          <MaterialCommunityIcons name="pill" size={18} color={colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-semibold leading-[19px]" style={{ color: colors.text }} numberOfLines={2}>
            {item.question}
          </Text>
          <Text className="text-[11px] mt-[3px]" style={{ color: colors.textSecondary }}>
            {item.category}
            {item.medicationName ? ` · ${item.medicationName}` : ""}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: toneColor + "18" }}>
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text className="text-[10px] font-bold" style={{ color: toneColor }}>{meta.label}</Text>
        </View>
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>{format(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
};

export default PharmacistQuestionCard;

