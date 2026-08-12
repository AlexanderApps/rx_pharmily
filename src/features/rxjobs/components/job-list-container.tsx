import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import JobListCard from "@/features/rxjobs/components/job-list-card";

interface JobListContainerProps {
  jobs: Job[];
  onCardPress: (id: string) => void;
}

const JobListContainer: React.FC<JobListContainerProps> = ({
  jobs,
  onCardPress,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={{ paddingVertical: 0, flex: 1 }}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: colors.background },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <JobListCard item={item} onPress={() => onCardPress(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>
              No job listings found
            </Text>
          </View>
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default JobListContainer;
