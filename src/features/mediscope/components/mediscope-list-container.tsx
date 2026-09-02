import React from "react";
import { FlatList, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import MaxWidthLayout from "@/shared/components/max-width-layout";
import { ThemedView } from "@/shared/components/themed-view";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import MediscopeListCard from "@/features/mediscope/components/mediscope-list-card";

interface MediscopeListContainerProps {
  requests: MediscopeCardData[];
  onCardPress: (id: string) => void;
}

// See rxrfq-list-container.tsx for the full rationale.
const COLUMNS_BY_BREAKPOINT = { compact: 1, regular: 2, wide: 3 } as const;

const MediscopeListContainer: React.FC<MediscopeListContainerProps> = ({
  requests,
  onCardPress,
}) => {
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const numColumns = COLUMNS_BY_BREAKPOINT[breakpoint];

  return (
    <ThemedView className="flex-1">
      <MaxWidthLayout size="wide" style={{ flex: 1 }}>
        <FlatList
          key={numColumns}
          data={requests}
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
              <MediscopeListCard item={item} onPress={() => onCardPress(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text style={{ color: colors.textSecondary }}>No MediScope requests found</Text>
            </View>
          }
        />
      </MaxWidthLayout>
    </ThemedView>
  );
};

export default MediscopeListContainer;

