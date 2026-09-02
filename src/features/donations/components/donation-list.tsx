import React from "react";
import { FlatList, View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import MaxWidthLayout from "@/shared/components/max-width-layout";
import DonationListCard from "@/features/donations/components/donation-list-card";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { ThemedView } from "@/shared/components/themed-view";

interface DonationListProps {
  donations: DonationCardData[];
  onCardPress: (id: string) => void;
  onCardEdit?: (id: string) => void;
  onCardDelete?: (id: string) => void;
}

// See rxrfq-list-container.tsx for the full rationale on this mapping,
// the key={numColumns} reset, and dropping ItemSeparatorComponent in
// favor of per-item margin — same shape, same reasons, applied here.
const COLUMNS_BY_BREAKPOINT = { compact: 1, regular: 2, wide: 3 } as const;

const DonationList: React.FC<DonationListProps> = ({
  donations,
  onCardPress,
  onCardEdit,
  onCardDelete,
}) => {
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const numColumns = COLUMNS_BY_BREAKPOINT[breakpoint];

  return (
    <ThemedView style={{ flex: 1 }}>
      <MaxWidthLayout size="wide" style={{ flex: 1 }}>
        <FlatList
          key={numColumns}
          data={donations}
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
              <DonationListCard
                donation={item}
                showActions={item.isOwner}
                onPress={() => onCardPress(item.id)}
                onEdit={onCardEdit ? () => onCardEdit(item.id) : undefined}
                onDelete={onCardDelete ? () => onCardDelete(item.id) : undefined}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text style={{ color: colors.textSecondary }}>
                No donations found
              </Text>
            </View>
          }
        />
      </MaxWidthLayout>
    </ThemedView>
  );
};

export default DonationList;

