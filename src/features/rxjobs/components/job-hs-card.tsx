import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface JobHsCardProps {
  item: Job;
  onPress?: (item: Job) => void;
}

export const JobHsCard = ({ item, onPress }: JobHsCardProps) => {
  const { colors } = useTheme();
  const isImmediate = item.urgency === "Immediate";

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
          {
            backgroundColor: isImmediate ? colors.error : colors.primary,
          },
        ]}
      />

      <View style={styles.body}>
        <View style={styles.logoRow}>
          <View
            style={[styles.logo, { backgroundColor: colors.backgroundElement }]}
          >
            <Text style={[styles.logoText, { color: colors.text }]}>
              {item.companyLogo}
            </Text>
          </View>
          <View style={styles.badgeInline}>
            <Text style={[styles.jobType, { color: colors.textSecondary }]}>
              {item.jobType}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.companyName}
        </Text>
      </View>

      <View style={styles.meta}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.metaText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>
        <View style={styles.iconRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {format(item.createdAt)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.salaryStrip,
          { backgroundColor: colors.success + "10" },
        ]}
      >
        <MaterialCommunityIcons
          name="cash-multiple"
          size={13}
          color={colors.success}
        />
        <Text
          style={[styles.salaryText, { color: colors.success }]}
          numberOfLines={1}
        >
          {item.salaryRange}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    borderRadius: 18,
    borderWidth: 0.5,
    marginRight: 12,
    overflow: "hidden",
  },
  accent: { height: 4 },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 6 },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 12, fontWeight: "700" },
  badgeInline: {},
  jobType: { fontSize: 11, fontWeight: "600" },
  title: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  meta: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 4,
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 11 },
  salaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  salaryText: { fontSize: 11, fontWeight: "600", flex: 1 },
});
