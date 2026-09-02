import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { VitalReading } from "@/features/vitals/types/vitals.types";
import { VITAL_TYPE_META } from "@/features/vitals/utils/vital-type-meta";
import { formatVitalValue } from "@/features/vitals/utils/format-vital";

interface VitalReadingCardProps {
  reading: VitalReading;
  onDelete: (id: string) => void;
}

const VitalReadingCard: React.FC<VitalReadingCardProps> = ({ reading, onDelete }) => {
  const { colors } = useTheme();
  const meta = VITAL_TYPE_META[reading.type];

  return (
    <View
      className="flex-row items-start gap-3 rounded-[14px] p-3.5"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }}
    >
      <View className="w-[38px] h-[38px] rounded-[11px] items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
        <MaterialCommunityIcons name={meta.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[11px] font-semibold uppercase tracking-[0.3px]" style={{ color: colors.textSecondary }}>{meta.label}</Text>
        <Text className="text-base font-bold mt-0.5" style={{ color: colors.text }}>{formatVitalValue(reading)}</Text>
        {reading.notes ? (
          <Text className="text-xs mt-1 leading-[17px] italic" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {reading.notes}
          </Text>
        ) : null}
        <Text className="text-[11px] mt-1.5" style={{ color: colors.textSecondary }}>{format(reading.recordedAt)}</Text>
      </View>
      <Pressable onPress={() => onDelete(reading.id)} hitSlop={8} className="p-1">
        <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

export default VitalReadingCard;

