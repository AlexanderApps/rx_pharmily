import React from "react";
import { ScrollView, Pressable, View, Platform} from "react-native";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import RxRfqListContainer from "@/features/rxrfqs/components/rxrfq-list-container";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

const RFQ_FILTERS = ["All", "Published", "Draft", "Closed", "Awarded"] as const;
type FilterType = (typeof RFQ_FILTERS)[number];

export default function MyRxRfqScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useTheme();
  const rxrfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const rxrfqs = useRxRfqsStore((state) => state.rxrfqs);

  // 1. Deriving state directly from query params fixes navigation bugs
  const activeFilter = React.useMemo<FilterType>(() => {
    if (!filter) return "All";

    const formattedFilter =
      filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();

    return RFQ_FILTERS.includes(formattedFilter as FilterType)
      ? (formattedFilter as FilterType)
      : "All";
  }, [filter]);

  // This screen is "My RxRFQs" — it's meant to show only the current
  // user's own requests (createdBy === user.id), the same comparison
  // every isOwner field in the app already uses. rxrfqMarketPlace is the
  // raw data still carrying createdBy; rxrfqs is the already-resolved
  // card view (facilityName/facilityLocation joined in) that
  // RxRfqListContainer expects — filtering the latter by an id set from
  // the former gets both the right scope and correctly-populated cards.
  const myRfqs = React.useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    const myIds = new Set(
      rxrfqMarketPlace.filter((rfq) => rfq.createdBy === userId).map((rfq) => rfq.id),
    );
    return rxrfqs.filter((rfq) => myIds.has(rfq.id));
  }, [rxrfqMarketPlace, rxrfqs]);

  // 2. Filter function handles case-insensitive status matching safely
  const filteredRfqs = React.useMemo(() => {
    return myRfqs.filter((rfq) => {
      if (activeFilter === "All") return true;
      return rfq.status?.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [myRfqs, activeFilter]);

  // 3. Update the route parameters instead of changing local state
  const handleFilterPress = (filterItem: string) => {
    router.setParams({ filter: filterItem.toLowerCase() });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView style={{ flex: 1 }}>
        <View
          className="px-4 pt-3 pb-3 border-b-[0.5px]"
          style={{ borderBottomColor: colors.backgroundElement }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {Platform.OS !== "web" && (
              <Pressable
                onPress={() => router.back()}
                className="mr-3 p-1"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              )}

              <View>
                <ThemedText
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  My RxRFQs
                </ThemedText>
                <ThemedText
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  Manage and track your requests for quotations
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <ThemedView className="py-[15px]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, maxHeight: 56 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {RFQ_FILTERS.map((filterItem) => {
              const isActive = activeFilter === filterItem;

              return (
                <Pressable
                  key={filterItem}
                  onPress={() => handleFilterPress(filterItem)}
                  className="px-[18px] py-2 rounded-full border-[1.5px] items-center justify-center"
                  style={
                    isActive
                      ? { backgroundColor: colors.secondary, borderColor: colors.secondary }
                      : { backgroundColor: "transparent", borderColor: "rgba(128,128,128,0.2)" }
                  }
                >
                  <ThemedText
                    className="text-sm font-semibold"
                    style={isActive ? { color: "#FFFFFF" } : undefined}
                  >
                    {filterItem}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>

        <ThemedView style={{ flex: 1 }}>
          <RxRfqListContainer
            rfqs={filteredRfqs}
            onCardPress={(id) =>
              router.push({
                pathname: "/rfqs/rxrfq-details-screen",
                params: { id },
              })
            }
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}


