import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { router, useLocalSearchParams } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import ApplySheet from "@/features/rxjobs/components/apply-sheet";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// Public view — anyone browsing the market lands here (Apply/Save/Share).
// Owners are routed to /jobs/job-details for management instead.
export default function JobMarketDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const jobs = useRxJobsStore((state) => state.jobs);
  const isLoadingJobs = useRxJobsStore((state) => state.isLoading);
  const hasApplied = useRxJobsStore((state) => state.hasApplied);
  const isSaved = useRxJobsStore((state) => state.isSaved);
  const toggleSaveJob = useRxJobsStore((state) => state.toggleSaveJob);
  const applyToJob = useRxJobsStore((state) => state.applyToJob);

  const applySheetRef = useRef<BottomSheetModal>(null);

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const applied = job ? hasApplied(job.id) : false;
  const saved = job ? isSaved(job.id) : false;

  if (!job) {
    if (isLoadingJobs) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
          No job found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isImmediate = job.urgency === "Immediate";
  const deadlineSoon =
    job.applicationDeadline &&
    job.applicationDeadline.getTime() - Date.now() < 1000 * 60 * 60 * 48;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${job.title} at ${job.companyName}\n${job.location}\n${job.salaryRange}`,
      });
    } catch {}
  };

  const handleSubmitApplication = async (coverNote: string) => {
    await applyToJob(job.id, coverNote || undefined);
    applySheetRef.current?.dismiss();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav bar */}
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.navbarMeta}>
          <Text style={[styles.navbarCode, { color: colors.text }]} numberOfLines={1}>
            {job.jobType}
          </Text>
          <Text style={[styles.navbarTime, { color: colors.textSecondary }]}>
            Posted {format(job.createdAt)}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: (isImmediate ? colors.error : colors.info) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: isImmediate ? colors.error : colors.info },
            ]}
          >
            {job.urgency}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <ClickableAvatar
            entityType="facility"
            entityId={job.postedBy}
            name={job.companyName}
            avatarColor={colors.primary}
            subtitle="Posted this job"
            size={52}
          />
          <View style={styles.heroMeta}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{job.title}</Text>
            <Text style={[styles.heroCompany, { color: colors.textSecondary }]}>
              {job.companyName}
            </Text>
            <View style={styles.heroLocationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.heroLocation, { color: colors.textSecondary }]}>
                {job.location}
              </Text>
            </View>
          </View>
        </View>

        {applied && (
          <View style={[styles.appliedBanner, { backgroundColor: colors.success + "18" }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
            <Text style={[styles.appliedBannerText, { color: colors.success }]}>
              You've applied to this role
            </Text>
          </View>
        )}

        {deadlineSoon && !applied && (
          <View style={[styles.appliedBanner, { backgroundColor: colors.warning + "18" }]}>
            <Ionicons name="hourglass-outline" size={15} color={colors.warning} />
            <Text style={[styles.appliedBannerText, { color: colors.warning }]}>
              Applications close {format(job.applicationDeadline!)}
            </Text>
          </View>
        )}

        {/* Description */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About the role</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {job.description}
        </Text>

        {/* Job info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <MaterialCommunityIcons name="cash-multiple" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Salary</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.salaryRange}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
            <View style={styles.infoRowLeft}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Job type</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.jobType}</Text>
          </View>
          {job.applicationDeadline && (
            <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
              <View style={styles.infoRowLeft}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Apply by
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {fmtDate(job.applicationDeadline)}
              </Text>
            </View>
          )}
        </View>

        {/* Requirements */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Requirements ({job.requirements.length})
        </Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          {job.requirements.map((req, index) => (
            <View
              key={index}
              style={[
                styles.reqRow,
                index !== job.requirements.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={16}
                color={colors.success}
              />
              <Text style={[styles.reqText, { color: colors.text }]}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FAB group */}
      <View style={styles.fabGroup}>
        <View style={styles.fabSecondary}>
          <Pressable
            onPress={() => toggleSaveJob(job.id)}
            style={[
              styles.fabIconBtn,
              {
                backgroundColor: saved ? colors.primary + "18" : colors.backgroundSecondary,
                borderColor: saved ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={saved ? colors.primary : colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={[styles.fabIconBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => !applied && applySheetRef.current?.present()}
          disabled={applied}
          style={({ pressed }) => [
            styles.fabPrimary,
            {
              backgroundColor: applied ? colors.backgroundElement : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={applied ? "check" : "file-send-outline"}
            size={18}
            color={applied ? colors.textSecondary : "#fff"}
          />
          <Text
            style={[
              styles.fabPrimaryText,
              { color: applied ? colors.textSecondary : "#fff" },
            ]}
          >
            {applied ? "Applied" : "Apply Now"}
          </Text>
        </Pressable>
      </View>

      <ApplySheet
        ref={applySheetRef}
        job={job}
        onClose={() => {}}
        onSubmit={handleSubmitApplication}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navbarMeta: { flex: 1 },
  navbarCode: { fontSize: 15, fontWeight: "500" },
  navbarTime: { fontSize: 12, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroLogo: { width: 56, height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  heroLogoText: { fontSize: 16, fontWeight: "700" },
  heroMeta: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 18, fontWeight: "700" },
  heroCompany: { fontSize: 13 },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocation: { fontSize: 13 },
  appliedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  appliedBannerText: { fontSize: 12, fontWeight: "600", flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  description: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 0.5, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  infoRowBorder: { borderTopWidth: 0.5 },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "500" },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  reqText: { fontSize: 13, flex: 1, lineHeight: 18 },
  fabGroup: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    pointerEvents: "box-none",
    gap: 10,
  },
  fabSecondary: { flexDirection: "row", gap: 8 },
  fabIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  fabPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabPrimaryText: { fontSize: 15, fontWeight: "600" },
});
