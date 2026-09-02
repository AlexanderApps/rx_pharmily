import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Platform} from "react-native";
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
import {
  ApplicationStatus,
  JobStatus,
} from "@/features/rxjobs/types/rxjobs.types";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const JOB_STATUS_META: Record<
  JobStatus,
  {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    tone: "success" | "warning" | "error";
  }
> = {
  open: { label: "Open", icon: "briefcase-check-outline", tone: "success" },
  closed: { label: "Closed", icon: "briefcase-off-outline", tone: "warning" },
  cancelled: { label: "Cancelled", icon: "cancel", tone: "error" },
};

const STATUS_META: Record<
  ApplicationStatus,
  {
    label: string;
    icon: string;
    tone: "success" | "warning" | "error" | "info";
  }
> = {
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
  const fetchApplicationsForJob = useRxJobsStore(
    (state) => state.fetchApplicationsForJob,
  );
  const deleteJob = useRxJobsStore((state) => state.deleteJob);
  const closeJob = useRxJobsStore((state) => state.closeJob);
  const cancelJob = useRxJobsStore((state) => state.cancelJob);
  const reopenJob = useRxJobsStore((state) => state.reopenJob);
  const updateApplicationStatus = useRxJobsStore(
    (state) => state.updateApplicationStatus,
  );

  useEffect(() => {
    if (id) fetchApplicationsForJob(id);
  }, [id]);

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const jobApplications = useMemo(
    () => applications.filter((a) => a.jobId === id),
    [applications, id],
  );

  if (!job) {
    if (isLoadingJobs) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No job found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isOwner = job.postedBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="p-4 gap-3">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
            This is a management view
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            Only {job.companyName} can manage this listing.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/jobs/job-market-details",
                params: { id: job.id },
              })
            }
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-[15px] font-semibold">View listing</Text>
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
      message:
        "This marks the search as ended (e.g. the position was filled). You can still review applicants, and can reopen it later.",
      confirmLabel: "Close Listing",
    });
    if (!ok) return;
    await closeJob(job.id);
    toast.success("Listing closed.");
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Withdraw this listing?",
      message:
        "This removes it from search results before it was filled. You can reopen it later if you change your mind.",
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Navbar */}
      <View
        className="flex-row items-center px-4 py-3 border-b gap-3"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 justify-center items-center"
          hitSlop={8}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        )}
        <View className="flex-1">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {job.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <View
              className="flex-row items-center gap-1 px-2 py-0.5 rounded-md"
              style={{ backgroundColor: statusColor + "18" }}
            >
              <MaterialCommunityIcons
                name={statusMeta.icon}
                size={11}
                color={statusColor}
              />
              <Text className="text-[10px] font-bold" style={{ color: statusColor }}>
                {statusMeta.label}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Posted {format(job.createdAt)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/jobs/post-job", params: { id: job.id } })
          }
          className="w-9 h-9 rounded-[10px] justify-center items-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-4">
        {/* Posted by */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <ClickableAvatar
            entityType="facility"
            entityId={job.postedBy}
            name={job.companyName}
            avatarColor={colors.primary}
            subtitle="Posted this job"
            size={38}
          />
          <View>
            <Text
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Posted by
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }}>
              {job.companyName}
            </Text>
          </View>
        </View>

        {/* Info card */}
        <View
          className="rounded-2xl border overflow-hidden mb-5"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between items-center px-3.5 py-2.5">
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Company
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {job.companyName}
            </Text>
          </View>
          <View
            className="flex-row justify-between items-center px-3.5 py-2.5 border-t"
            style={{ borderTopColor: colors.border }}
          >
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Job type
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {job.jobType}
            </Text>
          </View>
          <View
            className="flex-row justify-between items-center px-3.5 py-2.5 border-t"
            style={{ borderTopColor: colors.border }}
          >
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Salary
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {job.salaryRange}
            </Text>
          </View>
          {job.applicationDeadline && (
            <View
              className="flex-row justify-between items-center px-3.5 py-2.5 border-t"
              style={{ borderTopColor: colors.border }}
            >
              <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                Apply by
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmtDate(job.applicationDeadline)}
              </Text>
            </View>
          )}
        </View>

        {/* Applicants */}
        <Text
          className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: colors.text }}
        >
          Applicants ({jobApplications.length})
        </Text>

        {jobApplications.length === 0 ? (
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            No applicants yet.
          </Text>
        ) : (
          <View className="gap-2">
            {jobApplications.map((application) => {
              const meta = STATUS_META[application.status];
              const toneColor = colors[meta.tone];
              return (
                <View
                  key={application.id}
                  className="rounded-[14px] border p-3 gap-1.5 mb-2"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      className="text-sm font-semibold flex-1"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {application.applicantName}
                    </Text>
                    <View
                      className="flex-row items-center gap-1 px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: toneColor + "18" }}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={12}
                        color={toneColor}
                      />
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: toneColor }}
                      >
                        {meta.label}
                      </Text>
                    </View>
                  </View>
                  {application.coverNote ? (
                    <Text
                      className="text-xs leading-[17px] italic"
                      style={{ color: colors.textSecondary }}
                    >
                      {application.coverNote}
                    </Text>
                  ) : null}
                  <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                    Applied {format(application.appliedAt)}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5 mt-1">
                    {NEXT_ACTIONS.filter((a) => a.status !== application.status).map(
                      (action) => (
                        <Pressable
                          key={action.status}
                          onPress={() =>
                            updateApplicationStatus(application.id, action.status)
                          }
                          className="px-2.5 py-1.5 rounded-lg"
                          style={{ backgroundColor: colors.backgroundElement }}
                        >
                          <Text
                            className="text-[11px] font-semibold"
                            style={{ color: colors.text }}
                          >
                            {action.label}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Listing status actions */}
        <Text
          className="text-xs font-medium uppercase tracking-wide mb-2 mt-5"
          style={{ color: colors.text }}
        >
          Listing Status
        </Text>
        <View className="flex-row gap-2 mt-1">
          {job.status === "open" && (
            <>
              <Pressable
                onPress={handleClose}
                className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: colors.warning + "18" }}
              >
                <MaterialCommunityIcons
                  name="briefcase-off-outline"
                  size={15}
                  color={colors.warning}
                />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.warning }}
                >
                  Close
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: colors.error + "18" }}
              >
                <MaterialCommunityIcons name="cancel" size={15} color={colors.error} />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.error }}
                >
                  Withdraw
                </Text>
              </Pressable>
            </>
          )}
          {job.status !== "open" && (
            <Pressable
              onPress={handleReopen}
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.success + "18" }}
            >
              <MaterialCommunityIcons
                name="briefcase-check-outline"
                size={15}
                color={colors.success}
              />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: colors.success }}
              >
                Reopen
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border mt-2"
          style={{ borderColor: colors.error }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={colors.error}
          />
          <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
            Delete listing
          </Text>
        </Pressable>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}