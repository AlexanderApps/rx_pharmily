import React from "react";
import { StyleSheet, ScrollView, Pressable, View } from "react-native";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import RxRfqListContainer from "@/features/rxrfqs/components/rxrfq-list-container";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";

const RFQ_FILTERS = ["All", "Published", "Draft", "Closed", "Awarded"] as const;
type FilterType = (typeof RFQ_FILTERS)[number];

export default function MyRxRfqScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useTheme();
  const rxRfqData = useRxRfqsStore((state) => state.rxrfqs);

  // 1. Deriving state directly from query params fixes navigation bugs
  const activeFilter = React.useMemo<FilterType>(() => {
    if (!filter) return "All";

    const formattedFilter =
      filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();

    return RFQ_FILTERS.includes(formattedFilter as FilterType)
      ? (formattedFilter as FilterType)
      : "All";
  }, [filter]);

  // 2. Filter function handles case-insensitive status matching safely
  const filteredRfqs = React.useMemo(() => {
    return rxRfqData.filter((rfq) => {
      if (activeFilter === "All") return true;
      return rfq.status?.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [rxRfqData, activeFilter]);

  // 3. Update the route parameters instead of changing local state
  const handleFilterPress = (filterItem: string) => {
    router.setParams({ filter: filterItem.toLowerCase() });
  };

  return (
    <ThemedView style={styles.safeArea}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.backgroundElement },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <View>
                <ThemedText
                  style={[styles.headerTitle, { color: colors.text }]}
                >
                  My RxRFQs
                </ThemedText>
                <ThemedText
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Manage and track your requests for quotations
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <ThemedView style={styles.scrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, maxHeight: 56 }}
            contentContainerStyle={styles.scrollContainer}
          >
            {RFQ_FILTERS.map((filterItem) => {
              const isActive = activeFilter === filterItem;

              return (
                <Pressable
                  key={filterItem}
                  onPress={() => handleFilterPress(filterItem)}
                  style={[
                    styles.button,
                    isActive
                      ? {
                          backgroundColor: colors.secondary,
                          borderColor: colors.secondary,
                        }
                      : styles.inactiveButton,
                  ]}
                >
                  <ThemedText
                    style={[styles.buttonText, isActive && styles.activeText]}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollWrapper: { paddingVertical: 15 },
  scrollContainer: { paddingHorizontal: 20, gap: 10 },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveButton: {
    backgroundColor: "transparent",
    borderColor: "rgba(128,128,128,0.2)",
  },
  buttonText: { fontSize: 14, fontWeight: "600" },
  activeText: { color: "#FFFFFF" },
});
