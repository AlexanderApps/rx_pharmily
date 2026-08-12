import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import BottomSheet from "@/shared/components/bottom-sheet";
import CheckboxFilterGroup from "@/shared/components/checkbox-filter-group";
import FilterMenu from "@/shared/components/filter-menu";
import FilterButton from "@/shared/components/filter-button";

import { useTheme } from "@/shared/hooks/use-theme";
import useDonationFilters from "@/features/donations/hooks/use-donation-filter";
import Ionicons from "@expo/vector-icons/Ionicons";
import Input from "@/shared/components/input";

export default function SearchDonationsContent() {
  const filterModalRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const { colors } = useTheme();
  const {
    activeFilterConfig,
    modalTitle,
    snapPoints,
    openFilterModal,
    filters,
    activeFilter,
    clearActiveFilter,
    closeFilterModal,
  } = useDonationFilters({
    filterModalRef,
  });

  // Auto focus search input on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.backgroundElement,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>

            {/* Search */}
            <ThemedView
              style={{
                flex: 1,
              }}
            >
              <Input
                ref={searchInputRef}
                placeholder="Search medications..."
                value={search}
                onChangeText={setSearch}
                variant="flat"
                size="medium"
                returnKeyType="search"
                borderRadius={10}
                inputContainerStyle={{
                  paddingHorizontal: 14,
                }}
                leftIcon={
                  <Ionicons
                    name="search"
                    size={20}
                    color={colors.textSecondary}
                  />
                }
                rightIcon={
                  search ? (
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textSecondary}
                    />
                  ) : undefined
                }
                onRightIconPress={() => setSearch("")}
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Screen Content */}
        <ThemedView
          style={{
            flex: 1,
            paddingVertical: 10,
          }}
        >
          {/* Filters */}
          <FilterMenu>
            <FilterButton
              label="Region"
              onPress={() => openFilterModal("region")}
              size="small"
              isActive={activeFilter === "region"}
              hasSelectedValues={filters.regions.length > 0}
              badge={filters.regions.length || undefined}
            />

            <FilterButton
              label="Category"
              onPress={() => openFilterModal("category")}
              size="small"
              isActive={activeFilter === "category"}
              hasSelectedValues={filters.categories.length > 0}
              badge={filters.categories.length || undefined}
            />

            <FilterButton
              label="Price"
              onPress={() => openFilterModal("price")}
              size="small"
              isActive={activeFilter === "price"}
              hasSelectedValues={filters.prices.length > 0}
              badge={filters.prices.length || undefined}
            />
          </FilterMenu>

          {/* Content */}
          <ThemedView
            style={{
              flex: 1,
              padding: 16,
            }}
          >
            <ThemedText type="small">
              Search results will appear here.
            </ThemedText>
          </ThemedView>

          {/* Bottom Sheet Modal */}
          <BottomSheet
            ref={filterModalRef}
            snapPoints={snapPoints}
            showHandle
            cornerRadius={16}
            padding={20}
            enablePanDownToClose
            onChange={() => {}}
            onDismiss={clearActiveFilter}
            backgroundColor={colors.backgroundSecondary}
          >
            <ThemedView type="backgroundSecondary">
              <ThemedView
                type="backgroundSecondary"
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <ThemedText
                  style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}
                >
                  {modalTitle}
                </ThemedText>
                <ThemedView
                  type="backgroundSelected"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 8,
                    borderRadius: 999,
                  }}
                >
                  <Pressable onPress={closeFilterModal}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </Pressable>
                </ThemedView>
              </ThemedView>
              <ThemedView>
                {activeFilterConfig && (
                  <CheckboxFilterGroup
                    options={activeFilterConfig.options}
                    selectedOptions={activeFilterConfig.selectedOptions}
                    onToggleOption={activeFilterConfig.onToggle}
                  />
                )}
              </ThemedView>
            </ThemedView>
          </BottomSheet>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
