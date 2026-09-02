import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, TextInput, Platform} from "react-native";
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
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header Search Top Bar */}
        <ThemedView
          className="px-5 pb-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <ThemedView className="flex-row items-center gap-3 mt-4">
            {/* Back Button */}
            {Platform.OS !== "web" && (
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 rounded-[14px] justify-center items-center"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            )}

            {/* Input Search Container */}
            <ThemedView className="flex-1">
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

        {/* Screen Content Wrapper */}
        <ThemedView className="flex-1 py-2.5">
          {/* Filters List Area */}
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

          {/* Results Target Area */}
          <ThemedView className="flex-1 p-4">
            <ThemedText type="small">
              Search results will appear here.
            </ThemedText>
          </ThemedView>

          {/* Bottom Sheet Modal Sheet Component */}
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
                className="flex-row justify-between items-center mb-3"
              >
                <ThemedText className="text-base font-semibold mb-4">
                  {modalTitle}
                </ThemedText>
                <ThemedView
                  type="backgroundSelected"
                  className="flex-row items-center p-2 rounded-full"
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
