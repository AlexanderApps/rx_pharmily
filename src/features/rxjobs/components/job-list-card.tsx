import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { Job } from "@/features/rxjobs/types/rxjobs.types";

interface JobListCardProps {
  item: Job;
  onPress?: (item: Job) => void;
}

const JobListCard: React.FC<JobListCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isImmediate = item.urgency === "Immediate";
  const urgencyColor = isImmediate ? colors.error : colors.info;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.logo, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>{item.companyLogo}</Text>
        </View>

        <View style={styles.content}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.company, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.companyName}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: urgencyColor + "18" }]}>
          <MaterialCommunityIcons
            name={isImmediate ? "lightning-bolt-outline" : "calendar-outline"}
            size={11}
            color={urgencyColor}
          />
          <Text style={[styles.statusPillText, { color: urgencyColor }]}>{item.urgency}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
        <Text numberOfLines={1} style={[styles.locationText, { color: colors.textSecondary }]}>
          {item.location}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statsContainer}>
          <View style={[styles.badge, { backgroundColor: colors.secondary + "14" }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={12} color={colors.secondary} />
            <Text style={[styles.badgeText, { color: colors.secondary }]} numberOfLines={1}>
              {item.jobType}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: colors.success + "14" }]}>
            <MaterialCommunityIcons name="cash-multiple" size={12} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]} numberOfLines={1}>
              {item.salaryRange}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.iconRow}>
          {item.postedBy === currentUserId && (
            <>
              <MaterialCommunityIcons name="account-group-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.applicantsCount} applicants
              </Text>
            </>
          )}
        </View>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
          {format(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { fontSize: 12, fontWeight: "800" },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: "700" },
  company: { fontSize: 12, marginTop: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, marginLeft: 52 },
  locationText: { flex: 1, fontSize: 12 },
  footerRow: { marginTop: 12, marginLeft: 52 },
  statsContainer: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    maxWidth: 170,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 52,
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  timeAgo: { fontSize: 11 },
});

export default JobListCard;
