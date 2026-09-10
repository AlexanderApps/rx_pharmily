import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { ApplicationStatus, JobStatus, getJobPosterEntity } from "@/features/rxjobs/types/rxjobs.types";

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

const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" | "info" }
> = {
  submitted: { label: "Submitted", icon: "email-outline", tone: "info" },
  reviewing: { label: "Reviewing", icon: "eye-outline", tone: "warning" },
  shortlisted: { label: "Shortlisted", icon: "star-outline", tone: "success" },
  hired: { label: "Hired", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

// The applicant-facing view — anyone browsing a listing that isn't their
// own. This previously contained a byte-for-byte copy of job-details.tsx
// (the owner-only management screen), including its "only the owner can
// see this" gate — which meant every non-owner browsing a job was
// incorrectly blocked from ever seeing this screen's real content.
// job-details.tsx itself is untouched and remains the real management
// view; this file is now what it always should have been.
export default function JobMarketDetailsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const jobs = useRxJobsStore((state) => state.jobs);
  const isLoadingJobs = useRxJobsStore((state) => state.isLoading);
  const applications = useRxJobsStore((state) => state.applications);
  const fetchMyApplications = useRxJobsStore((state) => state.fetchMyApplications);
  const hasApplied = useRxJobsStore((state) => state.hasApplied);
  const applyToJob = useRxJobsStore((state) => state.applyToJob);
  const isSaved = useRxJobsStore((state) => state.isSaved);
  const toggleSaveJob = useRxJobsStore((state) => state.toggleSaveJob);

  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Needed so hasApplied (synchronous, reads local state only) has
    // something to check against — without this, a returning applicant
    // would see the apply form again instead of their existing status.
    fetchMyApplications();
  }, []);

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const myApplication = useMemo(
    () => (job ? applications.find((a) => a.jobId === job.id && a.applicantId === currentUserId) : undefined),
    [applications, job, currentUserId],
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

  // An owner viewing their own listing here isn't the applicant flow at
  // all — send them to the real management screen instead of showing an
  // apply form for their own job.
  if (isOwner) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="p-4 gap-3">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
            This is your own listing
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            Manage applicants and listing status from the management view instead.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({ pathname: "/jobs/job-details", params: { id: job.id } })
            }
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-[15px] font-semibold">Manage listing</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await applyToJob(job.id, coverNote.trim() || undefined);
      if (useRxJobsStore.getState().hasApplied(job.id)) {
        toast.success("Application submitted.");
        setCoverNote("");
      } else {
        toast.error("Couldn't submit your application. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = JOB_STATUS_META[job.status];
  const posterEntity = getJobPosterEntity(job);
  const statusColor = colors[statusMeta.tone];
  const canApply = job.status === "open" && !hasApplied(job.id);

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
              <MaterialCommunityIcons name={statusMeta.icon} size={11} color={statusColor} />
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
          onPress={() => toggleSaveJob(job.id)}
          className="w-9 h-9 rounded-[10px] justify-center items-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons
            name={isSaved(job.id) ? "bookmark" : "bookmark-outline"}
            size={18}
            color={isSaved(job.id) ? colors.primary : colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-4 pb-6">
        {/* Posted by */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <ClickableAvatar
            entityType={posterEntity.entityType}
            entityId={posterEntity.entityId}
            name={job.companyName}
            avatarColor={posterEntity.entityType === "organization" ? "#9333ea" : colors.primary}
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
          style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
        >
          <View className="flex-row justify-between items-center px-3.5 py-2.5">
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Location
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {job.location}
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

        {/* Description */}
        {job.description ? (
          <View className="mb-5">
            <Text
              className="text-xs font-medium uppercase tracking-wide mb-2"
              style={{ color: colors.text }}
            >
              Description
            </Text>
            <Text className="text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
              {job.description}
            </Text>
          </View>
        ) : null}

        {/* Requirements */}
        {job.requirements.length > 0 && (
          <View className="mb-5">
            <Text
              className="text-xs font-medium uppercase tracking-wide mb-2"
              style={{ color: colors.text }}
            >
              Requirements
            </Text>
            <View className="gap-1.5">
              {job.requirements.map((req, index) => (
                <View key={index} className="flex-row items-start gap-2">
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={15}
                    color={colors.primary}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    className="text-[13px] leading-[19px] flex-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {req}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Application */}
        <Text
          className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: colors.text }}
        >
          Your Application
        </Text>

        {myApplication ? (
          <View
            className="rounded-2xl border p-3.5 gap-1.5"
            style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
          >
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name={APPLICATION_STATUS_META[myApplication.status].icon}
                size={14}
                color={colors[APPLICATION_STATUS_META[myApplication.status].tone]}
              />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: colors[APPLICATION_STATUS_META[myApplication.status].tone] }}
              >
                {APPLICATION_STATUS_META[myApplication.status].label}
              </Text>
            </View>
            <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
              Applied {format(myApplication.appliedAt)}
            </Text>
            {myApplication.coverNote ? (
              <Text
                className="text-xs italic mt-1"
                style={{ color: colors.textSecondary }}
              >
                "{myApplication.coverNote}"
              </Text>
            ) : null}
          </View>
        ) : job.status !== "open" ? (
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            This listing is no longer accepting applications.
          </Text>
        ) : (
          <View className="gap-2.5">
            <TextInput
              value={coverNote}
              onChangeText={setCoverNote}
              placeholder="Add a short cover note (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              className="rounded-xl border p-3 text-[13px]"
              style={{
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
            <Pressable
              onPress={handleApply}
              disabled={submitting || !canApply}
              className="py-3.5 rounded-xl items-center"
              style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
            >
              <Text className="text-white text-[15px] font-semibold">
                {submitting ? "Submitting..." : "Apply"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
