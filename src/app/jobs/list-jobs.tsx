import { router } from "expo-router";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import MoreMenu from "@/shared/components/more-menu";
import JobListContainer from "@/features/rxjobs/components/job-list-container";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";

export default function ListJobs() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const jobs = useRxJobsStore((state) => state.jobs);
  const visibleJobs = jobs.filter((j) => j.status === "open" || j.postedBy === currentUserId);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.backgroundElement,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>

            {/* Search */}
            <ThemedView style={{ flex: 1 }}>
              <SearchButton
                placeholder="Search jobs..."
                onPress={() => {
                  router.push("/jobs/search-jobs");
                }}
                variant="default"
              />
            </ThemedView>

            {/* More Menu */}
            <MoreMenu
              iconColor={colors.text}
              style={{ backgroundColor: colors.backgroundElement }}
              items={[
                {
                  label: "Post a Job",
                  icon: "add-outline",
                  onPress: () => router.push("/jobs/post-job"),
                },
              ]}
            />
          </ThemedView>
        </ThemedView>

        {/* Screen Content Feed */}
        <ThemedView style={{ flex: 1 }}>
          <JobListContainer
            jobs={visibleJobs}
            onCardPress={(id) => {
              const isOwner = jobs.find((j) => j.id === id)?.postedBy === currentUserId;
              router.push({
                pathname: isOwner ? "/jobs/job-details" : "/jobs/job-market-details",
                params: { id },
              });
            }}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
