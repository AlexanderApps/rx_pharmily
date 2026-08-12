import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { ApplicationStatus, JobStatus } from "@/features/rxjobs/types/rxjobs.types";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "-";

const JOB_STATUS_META: Record<
  JobStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" }
> = {
  open: { label: "Open", icon: "briefcase-check-outline", tone: "success" },
  closed: { label: "Closed", icon: "briefcase-off-outline", tone: "warning" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
};

const STATUS_META: Record<ApplicationStatus, { label: string; icon: string; tone: "success" | "warning" | "error" | "info" }> = {
  submitted: { label: "Submitted", icon: "email-outline", tone: "info" },
  reviewing: { label: "Reviewing", icon: "eye-outline", tone: "warning" },
  shortlisted: { label: "Shortlisted", icon: "star-outline", tone: "success" },
  hired: { label: "Hired", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

const NEXT_ACTIONS: { status: ApplicationStatus; label: string }[] = [
  { status: "reviewing", label: "Review" },
  { status: "shortlisted", label: "Shortlist" },
  { status: "hired", label: "Hire" },
  { status: "rejected", label: "Reject" },
];

// Owner-only management screen. Anyone browsing someone else's listing is
// routed to /jobs/job-market-details instead.
export default function JobDetailsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const jobs = useRxJobsStore((state) => state.jobs);
  const isLoadingJobs = useRxJobsStore((state) => state.isLoading);
  const applications = useRxJobsStore((state) => state.applications);
  const fetchApplicationsForJob = useRxJobsStore((state) => state.fetchApplicationsForJob);

  useEffect(() => {
    if (id) fetchApplicationsForJob(id);
  }, [id]);

  const deleteJob = useRxJobsStore((state) => state.deleteJob);
  const closeJob = useRxJobsStore((state) => state.closeJob);
  const cancelJob = useRxJobsStore((state) => state.cancelJob);
  const reopenJob = useRxJobsStore((state) => state.reopenJob);
  const updateApplicationStatus = useRxJobsStore((state) => state.updateApplicationStatus);

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const jobApplications = useMemo(
    () => applications.filter((a) => a.jobId === id),
    [applications, id],
  );

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
        <Text style={{ color: colors.text, padding: 16 }}>No job found for id: {id}</Text>
      </SafeAreaView>
    );
  }

  const isOwner = job.postedBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
            This is a management view
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Only {job.companyName} can manage this listing.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({ pathname: "/jobs/job-market-details", params: { id: job.id } })
            }
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>View listing</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this listing?",
      message: `"${job.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const success = await deleteJob(job.id);
    if (success) {
      toast.success("Listing deleted.");
      router.back();
    } else {
      toast.error("Couldn't delete the listing.");
    }
  };

  const handleClose = async () => {
    const ok = await confirm({
      title: "Close this listing?",
      message: "This marks the search as ended (e.g. the position was filled). You can still review applicants, and can reopen it later.",
      confirmLabel: "Close Listing",
    });
    if (!ok) return;
    await closeJob(job.id);
    toast.success("Listing closed.");
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Withdraw this listing?",
      message: "This removes it from search results before it was filled. You can reopen it later if you change your mind.",
      confirmLabel: "Withdraw",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    await cancelJob(job.id);
    toast.success("Listing withdrawn.");
  };

  const handleReopen = async () => {
    const ok = await confirm({
      title: "Reopen this listing?",
      message: "It will be visible in search results again.",
      confirmLabel: "Reopen",
    });
    if (!ok) return;
    await reopenJob(job.id);
    toast.success("Listing reopened.");
  };

  const statusMeta = JOB_STATUS_META[job.status];
  const statusColor = colors[statusMeta.tone];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.navbarMeta}>
          <Text style={[styles.navbarCode, { color: colors.text }]} numberOfLines={1}>
            {job.title}
          </Text>
          <View style={styles.navbarStatusRow}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
              <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusMeta.label}</Text>
            </View>
            <Text style={[styles.navbarTime, { color: colors.textSecondary }]}>
              Posted {format(job.createdAt)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/jobs/post-job", params: { id: job.id } })}
          style={[styles.editBtn, { backgroundColor: colors.backgroundSecondary }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.postedByRow}>
          <ClickableAvatar
            entityType="facility"
            entityId={job.postedBy}
            name={job.companyName}
            avatarColor={colors.primary}
            subtitle="Posted this job"
            size={38}
          />
          <View>
            <Text style={[styles.postedByLabel, { color: colors.textSecondary }]}>Posted by</Text>
            <Text style={[styles.postedByName, { color: colors.text }]}>{job.companyName}</Text>
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Company</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.companyName}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Job type</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.jobType}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Salary</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{job.salaryRange}</Text>
          </View>
          {job.applicationDeadline && (
            <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Apply by</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {fmtDate(job.applicationDeadline)}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Applicants ({jobApplications.length})
        </Text>
        {jobApplications.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No applicants yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {jobApplications.map((application) => {
              const meta = STATUS_META[application.status];
              const toneColor = colors[meta.tone];
              return (
                <View
                  key={application.id}
                  style={[styles.appCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <View style={styles.appTopRow}>
                    <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
                      {application.applicantName}
                    </Text>
                    <View style={[styles.appBadge, { backgroundColor: toneColor + "18" }]}>
                      <MaterialCommunityIcons name={meta.icon as any} size={12} color={toneColor} />
                      <Text style={[styles.appBadgeText, { color: toneColor }]}>{meta.label}</Text>
                    </View>
                  </View>
                  {application.coverNote ? (
                    <Text style={[styles.appCover, { color: colors.textSecondary }]}>
                      {application.coverNote}
                    </Text>
                  ) : null}
                  <Text style={[styles.appTime, { color: colors.textSecondary }]}>
                    Applied {format(application.appliedAt)}
                  </Text>
                  <View style={styles.appActionsRow}>
                    {NEXT_ACTIONS.filter((a) => a.status !== application.status).map((action) => (
                      <Pressable
                        key={action.status}
                        onPress={() => updateApplicationStatus(application.id, action.status)}
                        style={[styles.appActionButton, { backgroundColor: colors.backgroundElement }]}
                      >
                        <Text style={[styles.appActionText, { color: colors.text }]}>{action.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Listing Status</Text>
        <View style={styles.statusActionsRow}>
          {job.status === "open" && (
            <>
              <Pressable
                onPress={handleClose}
                style={[styles.statusActionButton, { backgroundColor: colors.warning + "18" }]}
              >
                <MaterialCommunityIcons name="briefcase-off-outline" size={15} color={colors.warning} />
                <Text style={[styles.statusActionText, { color: colors.warning }]}>Close</Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                style={[styles.statusActionButton, { backgroundColor: colors.error + "18" }]}
              >
                <MaterialCommunityIcons name="cancel" size={15} color={colors.error} />
                <Text style={[styles.statusActionText, { color: colors.error }]}>Withdraw</Text>
              </Pressable>
            </>
          )}
          {job.status !== "open" && (
            <Pressable
              onPress={handleReopen}
              style={[styles.statusActionButton, { backgroundColor: colors.success + "18" }]}
            >
              <MaterialCommunityIcons name="briefcase-check-outline" size={15} color={colors.success} />
              <Text style={[styles.statusActionText, { color: colors.success }]}>Reopen</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.error }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete listing</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  navbarCode: { fontSize: 15, fontWeight: "600" },
  navbarStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  navbarTime: { fontSize: 12 },
  statusActionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusActionText: { fontSize: 13, fontWeight: "600" },
  editBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  card: { borderRadius: 16, borderWidth: 0.5, overflow: "hidden", marginBottom: 20 },
  postedByRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  postedByLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  postedByName: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11 },
  infoRowBorder: { borderTopWidth: 0.5 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "500" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  appCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6, marginBottom: 8 },
  appTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  appName: { fontSize: 14, fontWeight: "600", flex: 1 },
  appBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  appBadgeText: { fontSize: 10, fontWeight: "700" },
  appCover: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  appTime: { fontSize: 11 },
  appActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  appActionButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  appActionText: { fontSize: 11, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600" },
  primaryButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
