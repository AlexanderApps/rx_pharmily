import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedView } from "@/shared/components/themed-view";
import Input from "@/shared/components/input";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { JobType, JobUrgency } from "@/features/rxjobs/types/rxjobs.types";
import JobListContainer from "@/features/rxjobs/components/job-list-container";
import SearchFilterChip from "@/shared/components/search-filter-chip";

const JOB_TYPES: JobType[] = [
  "Locum Shift",
  "Full-Time",
  "Part-Time",
  "MSL / Industrial",
  "Hospital Specialist",
];

export default function SearchJobs() {
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<JobType | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const jobs = useRxJobsStore((state) => state.jobs);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (job.status !== "open" && job.postedBy !== currentUserId) return false;
      if (typeFilter && job.jobType !== typeFilter) return false;
      if (urgentOnly && job.urgency !== ("Immediate" as JobUrgency))
        return false;
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.companyName.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
      );
    });
  }, [jobs, search, typeFilter, urgentOnly, currentUserId]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
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

            <ThemedView style={{ flex: 1 }}>
              <Input
                ref={searchInputRef}
                placeholder="Search jobs, companies, locations..."
                value={search}
                onChangeText={setSearch}
                variant="flat"
                size="medium"
                returnKeyType="search"
                borderRadius={10}
                inputContainerStyle={{ paddingHorizontal: 14 }}
                leftIcon={
                  <Ionicons
                    name="search"
                    size={20}
                    color={colors.textSecondary}
                  />
                }
                rightIcon={
                  search ? (
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textSecondary}
                    />
                  ) : undefined
                }
                onRightIconPress={() => setSearch("")}
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Filter chips */}
        <View style={{ height: 52 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              gap: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <SearchFilterChip
              label="Hiring Immediately"
              icon="lightning-bolt-outline"
              active={urgentOnly}
              activeColor={colors.error}
              onPress={() => setUrgentOnly((v) => !v)}
            />

            {JOB_TYPES.map((type) => (
              <SearchFilterChip
                key={type}
                label={type}
                active={typeFilter === type}
                onPress={() => setTypeFilter(typeFilter === type ? null : type)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Results */}
        <ThemedView style={{ flex: 1 }}>
          <JobListContainer
            jobs={results}
            onCardPress={(id) => {
              const isOwner = results.find((j) => j.id === id)?.postedBy === currentUserId;
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
