import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";

interface MediscopeRowProps {
  item: MediscopeCardData;
  isLastItem: boolean;
  onPress?: (item: MediscopeCardData) => void;
}

const STATUS_COLOR_KEY: Record<MediscopeCardData["status"], "success" | "warning" | "error" | "info"> = {
  draft: "info",
  published: "success",
  fulfilled: "success",
  closed: "warning",
  cancelled: "error",
  expired: "error",
};

export const MediscopeRow = ({ item, isLastItem, onPress }: MediscopeRowProps) => {
  const { colors } = useTheme();
  const statusColor = colors[STATUS_COLOR_KEY[item.status]];

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[
        styles.row,
        !isLastItem && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.inner}>
        {item.imageUrl ? (
          <LoadingImage source={{ uri: item.imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name="pill" size={22} color={colors.secondary} />
          </View>
        )}

        <View style={styles.meta}>
          <Text style={[styles.product, { color: colors.text }]} numberOfLines={1}>
            {item.product}
          </Text>
          <Text style={[styles.facility, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.facilityName} · {item.facilityLocation}
          </Text>
        </View>

        <View style={styles.statusBlock}>
          <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
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
  thumb: { width: 48, height: 48, borderRadius: 12 },
  thumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  meta: { flex: 1, marginLeft: 12, gap: 2 },
  product: { fontSize: 15, fontWeight: "600" },
  facility: { fontSize: 13, marginTop: 2 },
  statusBlock: { alignItems: "flex-end", justifyContent: "space-between", minHeight: 48 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  timeAgo: { fontSize: 12 },
});
