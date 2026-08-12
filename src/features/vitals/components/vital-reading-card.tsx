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
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
        <MaterialCommunityIcons name={meta.icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>{meta.label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatVitalValue(reading)}</Text>
        {reading.notes ? (
          <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={2}>
            {reading.notes}
          </Text>
        ) : null}
        <Text style={[styles.time, { color: colors.textSecondary }]}>{format(reading.recordedAt)}</Text>
      </View>
      <Pressable onPress={() => onDelete(reading.id)} hitSlop={8} style={styles.deleteButton}>
        <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

export default VitalReadingCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  value: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  notes: { fontSize: 12, marginTop: 4, lineHeight: 17, fontStyle: "italic" },
  time: { fontSize: 11, marginTop: 6 },
  deleteButton: { padding: 4 },
});
