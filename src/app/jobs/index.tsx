import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated, Platform} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ActionButton from "@/shared/components/action-button";
import StatCard from "@/shared/components/stat-card";
import { SectionListContainer } from "@/shared/components/section-list-container";
import { HorizontalScrollContainer } from "@/shared/components/hs-section-container";
import { JobHsCard } from "@/features/rxjobs/components/job-hs-card";
import { JobRow } from "@/features/rxjobs/components/job-row";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { Job } from "@/features/rxjobs/types/rxjobs.types";

export default function RxJobsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const jobs = useRxJobsStore((state) => state.jobs);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerSearchOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const myJobs = useMemo(
    () => jobs.filter((j) => j.postedBy === currentUserId),
    [jobs, currentUserId],
  );

  // "Overview" mirrors the same pattern as rxrfq/donations/mediscope: the
  // current user's own postings, not global marketplace totals or the
  // user's own applications to other people's jobs (that's a separate,
  // job-seeker-facing view, reachable via "My Applications" below).
  const overviewStats = useMemo(() => {
    const myActivePostings = myJobs.filter((j) => j.status === "open");
    const totalApplicants = myActivePostings.reduce(
      (sum, j) => sum + j.applicantsCount,
      0,
    );
    const awaitingReview = myActivePostings.filter(
      (j) => j.applicantsCount > 0,
    ).length;

    return {
      activeCount: myActivePostings.length,
      totalApplicants,
      awaitingReview,
    };
  }, [myJobs]);

  // "My Jobs" below: the current user's own most-recently-posted jobs,
  // excluding ones that are settled (closed/cancelled).
  const myRecentJobs = useMemo(
    () =>
      [...myJobs]
        .filter((j) => j.status !== "closed" && j.status !== "cancelled")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [myJobs],
  );

  const immediateJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.urgency === "Immediate" &&
          (j.status === "open" || j.postedBy === currentUserId),
      ),
    [jobs, currentUserId],
  );

  const openJobDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/jobs/job-details" : "/jobs/job-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View
          className="border-b px-4 pb-3 pt-3"
          style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              {Platform.OS !== "web" && (
              <Pressable onPress={() => router.back()} className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              )}
              <View>
                <Text
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  RxJobs
                </Text>
                <Text
                  className="mt-0.5 text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Find your next pharmacy role
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/jobs/search-jobs")}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </Animated.View>

              {/* Create — web only; native keeps the floating action
                  button below instead. */}
              {Platform.OS === "web" && (
                <Pressable
                  onPress={() => router.push("/jobs/post-job")}
                  className="h-10 w-10 items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={22} color={colors.background} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Search */}
          <View className="mt-6 px-5">
            <Pressable
              onPress={() => router.push("/jobs/search-jobs")}
              className="flex-row items-center rounded-2xl border px-4 py-3 active:opacity-70"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                className="ml-3 flex-1 text-base"
                style={{ color: colors.textSecondary }}
              >
                Search jobs, companies, locations...
              </Text>
            </Pressable>
          </View>

          {/* Stats Overview */}
          <View className="mt-6 px-5">
            <Text
              className="mb-3 text-lg font-semibold"
              style={{ color: colors.text }}
            >
              Overview
            </Text>
            <View className="flex-row gap-3">
              <StatCard
                number={`${overviewStats.activeCount}`}
                label="Active Postings"
                type="success"
                colors={colors}
                onPress={() => router.push("/jobs/my-jobs")}
              />
              <StatCard
                number={`${overviewStats.totalApplicants}`}
                label="Applicants"
                type="info"
                colors={colors}
                onPress={() => router.push("/jobs/my-jobs")}
              />
              <StatCard
                number={`${overviewStats.awaitingReview}`}
                label="Awaiting"
                type="warning"
                colors={colors}
                onPress={() => router.push("/jobs/my-jobs")}
              />
            </View>
          </View>

          {/* My Jobs — posting history */}
          <SectionListContainer
            title="My Jobs"
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() => router.push("/jobs/my-jobs")}
          >
            {myRecentJobs.map((item: Job, index, slicedArray) => (
              <JobRow
                key={item.id}
                item={item}
                isLastItem={index === slicedArray.length - 1}
                onPress={() => openJobDetails(item.id, true)}
              />
            ))}
          </SectionListContainer>

          {/* Urgent roles */}
          <SectionListContainer
            title="Hiring Now"
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() => router.push("/jobs/list-jobs")}
          >
            {immediateJobs.slice(0, 3).map((item: Job, index, slicedArray) => (
              <JobRow
                key={item.id}
                item={item}
                isLastItem={index === slicedArray.length - 1}
                onPress={() =>
                  openJobDetails(item.id, item.postedBy === currentUserId)
                }
              />
            ))}
          </SectionListContainer>

          {/* All jobs */}
          <HorizontalScrollContainer
            title="Latest Openings"
            textColor={colors.text}
            onViewAllPress={() => router.push("/jobs/list-jobs")}
          >
            {[...jobs]
              .filter((item) => item.status === "open")
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((item) => (
                <JobHsCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    openJobDetails(item.id, item.postedBy === currentUserId)
                  }
                />
              ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View className="mt-6 px-5">
            <Text
              className="mb-3 text-lg font-semibold"
              style={{ color: colors.text }}
            >
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="briefcase-search-outline"
                    size={22}
                    color="#2563eb"
                  />
                }
                label="Browse"
                colors={colors}
                onPress={() => router.push("/jobs/list-jobs")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="file-account-outline"
                    size={22}
                    color="#16a34a"
                  />
                }
                label="My Applications"
                colors={colors}
                onPress={() => router.push("/jobs/my-applications")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="plus-box-outline"
                    size={22}
                    color="#9333ea"
                  />
                }
                label="Post a Job"
                colors={colors}
                onPress={() => router.push("/jobs/post-job")}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button — native only; web uses the header
            Create button instead. */}
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.push("/jobs/post-job")}
          className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full shadow-lg active:opacity-90 cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}