import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
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
  const applications = useRxJobsStore((state) => state.applications);

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

  const immediateJobs = useMemo(
    () =>
      jobs.filter(
        (j) => j.urgency === "Immediate" && (j.status === "open" || j.postedBy === currentUserId),
      ),
    [jobs, currentUserId],
  );

  const myApplicationsCount = applications.length;
  const shortlistedCount = useMemo(
    () => applications.filter((a) => a.status === "shortlisted").length,
    [applications],
  );

  const openJobDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/jobs/job-details" : "/jobs/job-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  RxJobs
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Find your next pharmacy role
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/jobs/search-jobs")}
                  style={[
                    styles.actionIconBtn,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Search */}
          <View style={styles.sectionPadding}>
            <Pressable
              onPress={() => router.push("/jobs/search-jobs")}
              style={({ pressed }) => [
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.searchText, { color: colors.textSecondary }]}
              >
                Search jobs, companies, locations...
              </Text>
            </Pressable>
          </View>

          {/* Stats Overview */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Overview
            </Text>

            <View style={styles.statsRow}>
              <StatCard
                number={`${jobs.length}`}
                label="Open Roles"
                type="info"
                colors={colors}
                onPress={() => router.push("/jobs/list-jobs")}
              />
              <StatCard
                number={`${myApplicationsCount}`}
                label="Applied"
                type="success"
                colors={colors}
                onPress={() => router.push("/jobs/my-applications")}
              />
              <StatCard
                number={`${shortlistedCount}`}
                label="Shortlisted"
                type="warning"
                colors={colors}
              />
            </View>
          </View>

          {/* My Jobs — posting history */}
          {myJobs.length > 0 && (
            <SectionListContainer
              title="My Jobs"
              backgroundColor={colors.backgroundSecondary}
              textColor={colors.text}
              onViewAllPress={() => router.push("/jobs/my-jobs")}
            >
              {myJobs.slice(0, 3).map((item: Job, index, slicedArray) => (
                <JobRow
                  key={item.id}
                  item={item}
                  isLastItem={index === slicedArray.length - 1}
                  onPress={() => openJobDetails(item.id, true)}
                />
              ))}
            </SectionListContainer>
          )}

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
                onPress={() => openJobDetails(item.id, item.postedBy === currentUserId)}
              />
            ))}
          </SectionListContainer>

          {/* All jobs */}
          <HorizontalScrollContainer
            title="Latest Openings"
            textColor={colors.text}
            onViewAllPress={() => router.push("/jobs/list-jobs")}
          >
            {jobs.map((item) => (
              <JobHsCard
                key={item.id}
                item={item}
                onPress={() => openJobDetails(item.id, item.postedBy === currentUserId)}
              />
            ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.statsRow}>
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

        {/* Floating Action Button */}
        <Pressable
          onPress={() => router.push("/jobs/post-job")}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftGroup: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionPadding: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchText: { flex: 1, marginLeft: 12, fontSize: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
