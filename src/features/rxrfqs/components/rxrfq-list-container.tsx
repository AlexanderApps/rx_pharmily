import React from "react";
import { FlatList, View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import MaxWidthLayout from "@/shared/components/max-width-layout";
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

// compact (phone/narrow window) stays exactly as before — 1 column, full
// native behavior, completely unaffected by anything below. regular/wide
// only change what was already a plain vertical list into a grid; card
// content itself isn't touched.
const COLUMNS_BY_BREAKPOINT = { compact: 1, regular: 2, wide: 3 } as const;

const RxRfqListContainer: React.FC<RxRfqListProps> = ({
  rfqs,
  onCardPress,
  onCardEdit,
  onCardDelete,
  isCreatorView = false,
}) => {
  const { colors } = useTheme();
  const breakpoint = useBreakpoint();
  const numColumns = COLUMNS_BY_BREAKPOINT[breakpoint];

  return (
    <ThemedView className="flex-1 py-0">
      {/* MaxWidthLayout's own inner View has no explicit flex — fine for
          most uses, but FlatList specifically needs a bounded-height
          container to scroll/virtualize correctly, so flex:1 is passed
          in here rather than assumed. */}
      <MaxWidthLayout size="wide" style={{ flex: 1 }}>
        <FlatList
          // FlatList cannot change numColumns on the fly without a key
          // reset (a documented React Native requirement, not
          // web-specific) — without this, resizing a browser window
          // across a breakpoint boundary would throw. ItemSeparatorComponent
          // is deliberately not used here: it renders between every item
          // in the flattened list, including within a single grid row
          // once numColumns > 1, which would show as a gap between two
          // side-by-side cards rather than only between rows — per-item
          // margin below works the same way regardless of column count.
          key={numColumns}
          data={rfqs}
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
              <RxRfqCard
                rfq={item}
                showActions={isCreatorView}
                onPress={() => onCardPress(item.id)}
                onEdit={onCardEdit ? () => onCardEdit(item.id) : undefined}
                onDelete={onCardDelete ? () => onCardDelete(item.id) : undefined}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text style={{ color: colors.textSecondary }}>No RxRfqs found</Text>
            </View>
          }
        />
      </MaxWidthLayout>
    </ThemedView>
  );
};

export default RxRfqListContainer;

