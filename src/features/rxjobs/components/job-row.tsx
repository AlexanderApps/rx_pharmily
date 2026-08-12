import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface JobRowProps {
  item: Job;
  isLastItem: boolean;
  onPress?: (item: Job) => void;
}

export const JobRow = ({ item, isLastItem, onPress }: JobRowProps) => {
  const { colors } = useTheme();
  const isImmediate = item.urgency === "Immediate";

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
          style={[styles.logo, { backgroundColor: colors.backgroundElement }]}
        >
          <Text style={[styles.logoText, { color: colors.text }]}>
            {item.companyLogo}
          </Text>
        </View>

        <View style={styles.meta}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            style={[styles.company, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.companyName}
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
                backgroundColor: isImmediate
                  ? colors.error + "20"
                  : colors.info + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isImmediate ? colors.error : colors.info },
              ]}
            >
              {item.urgency}
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { fontSize: 13, fontWeight: "700" },
  meta: { flex: 1, marginLeft: 12, gap: 2 },
  title: { fontSize: 15, fontWeight: "600" },
  company: { fontSize: 13 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 13 },
  statusBlock: { alignItems: "flex-end", justifyContent: "space-between", minHeight: 48 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "500" },
  timeAgo: { fontSize: 12 },
});
