import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text, Pressable, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import JobListContainer from "@/features/rxjobs/components/job-list-container";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";

// Jobs has a simpler status model than RxRFQ/MediScope/Donations (no
// draft-equivalent state — a posting is open the moment it's created) —
// "Has Applicants" stands in for the other features' "Responded".
const JOB_FILTERS = ["All", "Open", "Closed", "Cancelled", "Has Applicants"] as const;
type FilterType = (typeof JOB_FILTERS)[number];

// Mirrors app/rfqs/my-rfqs.tsx, app/mediscope/my-mediscope.tsx, and
// app/donations/my-donations.tsx's structure — same filter-tab pattern,
// same query-param-driven active filter, same postedBy scope.
export default function MyJobsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const jobs = useRxJobsStore((state) => state.jobs);

  const activeFilter = React.useMemo<FilterType>(() => {
    if (!filter) return "All";

    const formattedFilter =
      filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();

    // "Has Applicants" doesn't survive the toLowerCase()/single-word
    // round trip other filters do (its query-param form is
    // "has applicants" or "has-applicants"), so it's matched separately.
    if (filter.replace(/-/g, " ").toLowerCase() === "has applicants") return "Has Applicants";

    return JOB_FILTERS.includes(formattedFilter as FilterType)
      ? (formattedFilter as FilterType)
      : "All";
  }, [filter]);

  const myJobs = React.useMemo(
    () => jobs.filter((j) => j.postedBy === currentUserId),
    [jobs, currentUserId],
  );

  // "Has Applicants" isn't a real status value — it's open postings
  // that have at least one applicant, so it needs its own compound
  // check rather than the direct status match every other filter uses.
  const filteredJobs = React.useMemo(() => {
    return myJobs.filter((j) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Has Applicants") return j.status === "open" && j.applicantsCount > 0;
      return j.status?.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [myJobs, activeFilter]);

  const handleFilterPress = (filterItem: string) => {
    router.setParams({ filter: filterItem.toLowerCase().replace(/ /g, "-") });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>My Jobs</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {myJobs.length} posted
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/jobs/post-job")}
            className="w-9 h-9 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <ThemedView className="py-[15px]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, maxHeight: 56 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {JOB_FILTERS.map((filterItem) => {
              const isActive = activeFilter === filterItem;

              return (
                <Pressable
                  key={filterItem}
                  onPress={() => handleFilterPress(filterItem)}
                  className="px-[18px] py-2 rounded-full border-[1.5px] items-center justify-center"
                  style={
                    isActive
                      ? { backgroundColor: colors.secondary, borderColor: colors.secondary }
                      : { backgroundColor: "transparent", borderColor: "rgba(128,128,128,0.2)" }
                  }
                >
                  <ThemedText
                    className="text-sm font-semibold"
                    style={isActive ? { color: "#FFFFFF" } : undefined}
                  >
                    {filterItem}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>

        <ThemedView className="flex-1">
          <JobListContainer
            jobs={filteredJobs}
            onCardPress={(id) => router.push({ pathname: "/jobs/job-details", params: { id } })}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
