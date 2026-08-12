import React, { useEffect, useMemo } from "react";
import { router } from "expo-router";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedView } from "@/shared/components/themed-view";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { ApplicationStatus, Job } from "@/features/rxjobs/types/rxjobs.types";

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  submitted: { label: "Submitted", icon: "email-outline", tone: "info" },
  reviewing: { label: "Reviewing", icon: "eye-outline", tone: "warning" },
  shortlisted: { label: "Shortlisted", icon: "star-outline", tone: "success" },
  hired: { label: "Hired", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

export default function MyApplicationsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const applications = useRxJobsStore((state) => state.applications);
  const jobs = useRxJobsStore((state) => state.jobs);
  const fetchMyApplications = useRxJobsStore((state) => state.fetchMyApplications);

  useEffect(() => {
    fetchMyApplications();
  }, []);


  const rows = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
      .map((application) => ({
        application,
        job: jobs.find((j) => j.id === application.jobId),
      }));
  }, [applications, jobs]);

  const handlePress = (job: Job | undefined) => {
    if (!job) return;
    const isOwner = job.postedBy === currentUserId;
    router.push({
      pathname: isOwner ? "/jobs/job-details" : "/jobs/job-market-details",
      params: { id: job.id },
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>My Applications</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {applications.length} applied
            </Text>
          </View>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.application.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="file-account-outline" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                You haven't applied to any jobs yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.application.status];
            const toneColor = colors[meta.tone];
            return (
              <Pressable
                onPress={() => handlePress(item.job)}
                style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.job?.title ?? "Listing no longer available"}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.job?.companyName ?? "-"} · Applied {format(item.application.appliedAt)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: toneColor + "18" }]}>
                    <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
                    <Text style={[styles.statusPillText, { color: toneColor }]}>{meta.label}</Text>
                  </View>
                </View>
                {item.application.coverNote ? (
                  <Text style={[styles.coverNote, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.application.coverNote}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardMeta: { fontSize: 11, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  coverNote: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
});
