import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import MediscopeNamePlaceholder from "@/features/mediscope/components/mediscope-name-placeholder";

interface MediscopeHsCardProps {
  item: MediscopeCardData;
  onPress?: (item: MediscopeCardData) => void;
}

export const MediscopeHsCard = ({ item, onPress }: MediscopeHsCardProps) => {
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
      {item.imageUrl ? (
        <LoadingImage source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <MediscopeNamePlaceholder product={item.product} style={styles.image} fontSize={13} />
      )}

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.product}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.facilityName}
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
          style={[styles.badge, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="reply-all-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.badgeText, { color: colors.text }]}>{item.responseCount}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 18,
    borderWidth: 0.5,
    marginRight: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 100 },
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, gap: 2 },
  title: { fontSize: 14, fontWeight: "600" },
  subtitle: { fontSize: 12 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "500" },
});
