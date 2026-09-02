import React from "react";
import { FlatList, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import MaxWidthLayout from "@/shared/components/max-width-layout";
import { ThemedView } from "@/shared/components/themed-view";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import JobListCard from "@/features/rxjobs/components/job-list-card";

interface JobListContainerProps {
  jobs: Job[];
  onCardPress: (id: string) => void;
}

// See rxrfq-list-container.tsx for the full rationale.
const COLUMNS_BY_BREAKPOINT = { compact: 1, regular: 2, wide: 3 } as const;

const JobListContainer: React.FC<JobListContainerProps> = ({
  jobs,
  onCardPress,
}) => {
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const numColumns = COLUMNS_BY_BREAKPOINT[breakpoint];

  return (
    <ThemedView className="py-0 flex-1">
      <MaxWidthLayout size="wide" style={{ flex: 1 }}>
        <FlatList
          key={numColumns}
          data={jobs}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 40,
            backgroundColor: colors.background,
          }}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          renderItem={({ item }) => (
            <View style={{ flex: 1, marginBottom: 12 }}>
              <JobListCard item={item} onPress={() => onCardPress(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text style={{ color: colors.textSecondary }}>
                No job listings found
              </Text>
            </View>
          }
        />
      </MaxWidthLayout>
    </ThemedView>
  );
};

export default JobListContainer;

