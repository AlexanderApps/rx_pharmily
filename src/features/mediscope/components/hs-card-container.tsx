import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { MediscopeRequestCardData } from "@/features/mediscope/types/mediscope.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface HorizontalRequestCardProps {
  item: MediscopeRequestCardData;
  onPress?: (item: MediscopeRequestCardData) => void;
  accentColor?: string;
}

export const HorizontalRequestCard = ({
  item,
  onPress,
  accentColor,
}: HorizontalRequestCardProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {/* Accent bar */}
      <View
        style={[
          styles.accent,
          { backgroundColor: accentColor || colors.backgroundSecondary },
        ]}
      />

      {/* Header */}
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.facilityName}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.facilityLocation}
        </Text>
      </View>

      {/* Meta row: published time + product count */}
      <View style={styles.meta}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color="#16a34a"
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {format(item.publishedAt)}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="pill"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {item.productCount}
          </Text>
        </View>
      </View>

      {/* Deadline strip */}
      <View
        style={[
          styles.deadlineStrip,
          { backgroundColor: colors.warning + "10" },
        ]}
      >
        <Ionicons name="hourglass-outline" size={13} color={colors.warning} />
        <Text style={[styles.deadlineText, { color: colors.warning }]}>
          {format(item.submissionDeadline)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 230,
    borderRadius: 18,
    borderWidth: 0.5,
    marginRight: 12,
    overflow: "hidden",
  },
  accent: {
    height: 4,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deadlineStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deadlineText: {
    fontSize: 12,
  },
});
