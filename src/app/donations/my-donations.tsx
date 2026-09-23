import React from "react";
import { ScrollView, Pressable, View, Platform} from "react-native";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import DonationList from "@/features/donations/components/donation-list";
import { convertToCardData, useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

// Donations has a simpler status model than RxRFQ/MediScope (no draft/
// published distinction, no awarded/fulfilled) — "Opened" and "Hidden"
// stand in for "Published" and "Draft" respectively.
const DONATION_FILTERS = ["All", "Opened", "Hidden", "Closed", "Responded"] as const;
type FilterType = (typeof DONATION_FILTERS)[number];

// Mirrors app/rfqs/my-rfqs.tsx and app/mediscope/my-mediscope.tsx's
// structure exactly — same filter-tab pattern, same query-param-driven
// active filter, same createdBy scope.
export default function MyDonationsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useTheme();
  const donations = useDonationStore((state) => state.donations);

  const activeFilter = React.useMemo<FilterType>(() => {
    if (!filter) return "All";

    const formattedFilter =
      filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();

    return DONATION_FILTERS.includes(formattedFilter as FilterType)
      ? (formattedFilter as FilterType)
      : "All";
  }, [filter]);

  // This screen is "My Donations" — it's meant to show only the current
  // user's own donations (createdBy === user.id), the same comparison
  // every isOwner field in the app already uses.
  const myDonations = React.useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return donations.filter((d) => d.createdBy === userId);
  }, [donations]);

  // "Responded" isn't a real status value — it's active donations
  // (opened) that have at least one response, so it needs its own
  // compound check rather than the direct status match every other
  // filter uses. Matches RxRFQ's and MediScope's own "Responded" filter.
  const filteredDonations = React.useMemo(() => {
    const filtered = myDonations.filter((d) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Responded") return d.status === "opened" && d.responseCount > 0;
      return d.status?.toLowerCase() === activeFilter.toLowerCase();
    });
    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(convertToCardData);
  }, [myDonations, activeFilter]);

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
                  My Donations
                </ThemedText>
                <ThemedText
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  Manage and track your donations
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
            {DONATION_FILTERS.map((filterItem) => {
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
          <DonationList
            donations={filteredDonations}
            onCardPress={(id) =>
              router.push({
                pathname: "/donations/donation-details",
                params: { id },
              })
            }
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
