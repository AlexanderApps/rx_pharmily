import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface DonationRowProps {
  item: DonationCardData;
  isLastItem: boolean;
  onPress?: (item: DonationCardData) => void;
}

const STATUS_META: Record<
  DonationCardData["status"],
  { icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  opened: { icon: "eye-outline" },
  hidden: { icon: "eye-off-outline" },
  closed: { icon: "lock-outline" },
};

export const DonationRow = ({ item, isLastItem, onPress }: DonationRowProps) => {
  const { colors } = useTheme();
  const isOpened = item.status === "opened";

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[
        styles.row,
        !isLastItem && {
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.inner}>
        <View
          style={[styles.iconBlock, { backgroundColor: colors.backgroundElement }]}
        >
          <MaterialCommunityIcons
            name="hand-heart-outline"
            size={22}
            color={colors.secondary}
          />
        </View>

        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.facilityName}
          </Text>
          <Text
            style={[styles.itemCount, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
          </Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
        </View>

        <View style={styles.statusBlock}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isOpened
                  ? colors.success + "20"
                  : colors.backgroundElement,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={STATUS_META[item.status].icon}
              size={12}
              color={isOpened ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isOpened ? colors.success : colors.textSecondary },
              ]}
            >
              {item.status}
            </Text>
          </View>
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { padding: 16 },
  inner: { flexDirection: "row", alignItems: "flex-start" },
  iconBlock: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: { flex: 1, marginLeft: 12, gap: 2 },
  name: { fontSize: 15, fontWeight: "500" },
  itemCount: { fontSize: 13 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 13 },
  statusBlock: { alignItems: "flex-end", justifyContent: "space-between", minHeight: 48 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "500", textTransform: "capitalize" },
  timeAgo: { fontSize: 12 },
});
