import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import MediscopeListCard from "@/features/mediscope/components/mediscope-list-card";

interface MediscopeListContainerProps {
  requests: MediscopeCardData[];
  onCardPress: (id: string) => void;
}

const MediscopeListContainer: React.FC<MediscopeListContainerProps> = ({
  requests,
  onCardPress,
}) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: colors.background },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <MediscopeListCard item={item} onPress={() => onCardPress(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>No MediScope requests found</Text>
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
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center" },
});

export default MediscopeListContainer;
