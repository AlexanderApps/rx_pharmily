import React from "react";
import { router } from "expo-router";
import { View, Text, Pressable, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedView } from "@/shared/components/themed-view";
import JobListContainer from "@/features/rxjobs/components/job-list-container";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";

export default function MyJobsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const jobs = useRxJobsStore((state) => state.jobs);
  const myJobs = jobs.filter((j) => j.postedBy === currentUserId);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Navigation Top Header Bar */}
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

        {/* Core Content Body Area */}
        <ThemedView className="flex-1">
          <JobListContainer
            jobs={myJobs}
            onCardPress={(id) => router.push({ pathname: "/jobs/job-details", params: { id } })}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
