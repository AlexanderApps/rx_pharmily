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
      style={[
        styles.card,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary + "18" }]}>
          <MaterialCommunityIcons name="pill" size={18} color={colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.question, { color: colors.text }]} numberOfLines={2}>
            {item.question}
          </Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {item.category}
            {item.medicationName ? ` · ${item.medicationName}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.statusPill, { backgroundColor: toneColor + "18" }]}>
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text style={[styles.statusText, { color: toneColor }]}>{meta.label}</Text>
        </View>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{format(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
};

export default PharmacistQuestionCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  question: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  category: { fontSize: 11, marginTop: 3 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },
  timeAgo: { fontSize: 11 },
});
