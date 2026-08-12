import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import DonationListCard from "@/features/donations/components/donation-list-card";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { ThemedView } from "@/shared/components/themed-view";

interface DonationListProps {
  donations: DonationCardData[];
  onCardPress: (id: string) => void;
  onCardEdit?: (id: string) => void;
  onCardDelete?: (id: string) => void;
}

const DonationList: React.FC<DonationListProps> = ({
  donations,
  onCardPress,
  onCardEdit,
  onCardDelete,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={donations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: colors.background },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <DonationListCard
            donation={item}
            showActions={item.isOwner}
            onPress={() => onCardPress(item.id)}
            onEdit={onCardEdit ? () => onCardEdit(item.id) : undefined}
            onDelete={onCardDelete ? () => onCardDelete(item.id) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>
              No donations found
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

export default DonationList;
