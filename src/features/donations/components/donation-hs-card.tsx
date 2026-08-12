import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface DonationHsCardProps {
  item: DonationCardData;
  onPress?: (item: DonationCardData) => void;
}

export const DonationHsCard = ({ item, onPress }: DonationHsCardProps) => {
  const { colors } = useTheme();
  const isOpened = item.status === "opened";

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
      <View
        style={[
          styles.accent,
          { backgroundColor: isOpened ? colors.success : colors.backgroundSecondary },
        ]}
      />

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.facilityName}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.location}
        </Text>
      </View>

      <View style={styles.meta}>
        <View style={styles.iconRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {format(item.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {item.itemCount}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusStrip,
          {
            backgroundColor:
              (isOpened ? colors.success : colors.textSecondary) + "10",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={isOpened ? "eye-outline" : "eye-off-outline"}
          size={13}
          color={isOpened ? colors.success : colors.textSecondary}
        />
        <Text
          style={[
            styles.statusText,
            { color: isOpened ? colors.success : colors.textSecondary },
          ]}
        >
          {item.status}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 18,
    borderWidth: 0.5,
    marginRight: 12,
    overflow: "hidden",
  },
  accent: { height: 4 },
  body: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, gap: 2 },
  title: { fontSize: 15, fontWeight: "500" },
  subtitle: { fontSize: 13 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: "500" },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 12, textTransform: "capitalize" },
});
