import React from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import RxRfqCard from "@/features/rxrfqs/components/rxrfq-card";
import { ThemedView } from "@/shared/components/themed-view";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqListProps {
  rfqs: RxRfqCardData[];
  onCardPress: (id: string) => void;
  onCardEdit?: (id: string) => void;
  onCardDelete?: (id: string) => void;
  isCreatorView?: boolean;
}

const RxRfqListContainer: React.FC<RxRfqListProps> = ({
  rfqs,
  onCardPress,
  onCardEdit,
  onCardDelete,
  isCreatorView = false,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={{ paddingVertical: 0, flex: 1 }}>
      <FlatList
        data={rfqs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.cardWrapper,
          { backgroundColor: colors.background },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item, index }) => (
          <RxRfqCard
            rfq={item}
            showActions={isCreatorView}
            onPress={() => onCardPress(item.id)}
            onEdit={onCardEdit ? () => onCardEdit(item.id) : undefined}
            onDelete={onCardDelete ? () => onCardDelete(item.id) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>No RxRfqs found</Text>
          </View>
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
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

export default RxRfqListContainer;
