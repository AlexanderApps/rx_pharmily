import React, { useEffect, useMemo } from "react";
import { router } from "expo-router";
import { View, Text, FlatList, Pressable, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedView } from "@/shared/components/themed-view";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { ApplicationStatus, Job } from "@/features/rxjobs/types/rxjobs.types";

const STATUS_META: Record<
  ApplicationStatus,
  {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    tone: "success" | "warning" | "error" | "info";
  }
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
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      )
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
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center gap-3 px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              My Applications
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {applications.length} applied
            </Text>
          </View>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.application.id}
          contentContainerClassName="p-4 grow"
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="file-account-outline" message="You haven't applied to any jobs yet." />
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.application.status];
            const toneColor = colors[meta.tone];
            return (
              <Pressable
                onPress={() => handlePress(item.job)}
                className="rounded-[14px] border p-3.5 gap-1.5"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-start gap-2.5">
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {item.job?.title ?? "Listing no longer available"}
                    </Text>
                    <Text
                      className="text-[11px] mt-0.5"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {item.job?.companyName ?? "-"} · Applied{" "}
                      {format(item.application.appliedAt)}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ backgroundColor: toneColor + "18" }}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={11}
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
                {item.application.coverNote ? (
                  <Text
                    className="text-xs leading-[17px] italic"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={2}
                  >
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