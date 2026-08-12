import React from "react";
import { router } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>My Jobs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {myJobs.length} posted
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/jobs/post-job")}
            style={[styles.newButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <ThemedView style={{ flex: 1 }}>
          <JobListContainer
            jobs={myJobs}
            onCardPress={(id) => router.push({ pathname: "/jobs/job-details", params: { id } })}
          />
        </ThemedView>
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
  newButton: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
