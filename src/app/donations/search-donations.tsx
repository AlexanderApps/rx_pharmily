import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, TextInput, Platform} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/shared/components/themed-view";
import BottomSheet from "@/shared/components/bottom-sheet";
import CheckboxFilterGroup from "@/shared/components/checkbox-filter-group";
import FilterMenu from "@/shared/components/filter-menu";
import FilterButton from "@/shared/components/filter-button";
import DonationList from "@/features/donations/components/donation-list";

import { useTheme } from "@/shared/hooks/use-theme";
import useDonationFilters from "@/features/donations/hooks/use-donation-filter";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { convertToCardData, useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import Ionicons from "@expo/vector-icons/Ionicons";
import Input from "@/shared/components/input";

// Items expiring within this many days count as "expiring soon" — a
// donation qualifies if it has at least one such item, since a
// facility looking to claim quickly cares about any urgency in the
// batch, not just whether the whole thing is about to expire.
const EXPIRING_SOON_DAYS = 30;

export default function SearchDonationsContent() {
  const filterModalRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const donations = useDonationStore((state) => state.donations);
  const facilities = useProfileStore((state) => state.facilities);
  const regionByFacilityId = useMemo(() => new Map(facilities.map((f) => [f.id, f.region])), [facilities]);
  const {
    activeFilterConfig,
    modalTitle,
    snapPoints,
    openFilterModal,
    filters,
    activeFilter,
    clearActiveFilter,
    expiringSoonOnly,
    setExpiringSoonOnly,
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

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const soonCutoff = now + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
    return donations
      .filter((d) => {
        if (d.isRemoved || d.status !== "opened") return false;
        if (filters.regions.length > 0) {
          const region = regionByFacilityId.get(d.facility);
          if (!region || !filters.regions.includes(region)) return false;
        }
        if (filters.categories.length > 0 && !filters.categories.some((c) => d.categories.includes(c))) return false;
        if (expiringSoonOnly) {
          const hasExpiringSoonItem = d.donatedItems.some((item) => {
            const expiry = new Date(item.expiryDate).getTime();
            return expiry >= now && expiry <= soonCutoff;
          });
          if (!hasExpiringSoonItem) return false;
        }
        if (!q) return true;
        return (
          d.code.toLowerCase().includes(q) ||
          d.facilityName.toLowerCase().includes(q) ||
          d.facilityLocation.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(convertToCardData);
  }, [donations, search, filters, expiringSoonOnly, regionByFacilityId]);


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
                placeholder="Search donations..."
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
              label="Expiring Soon"
              onPress={() => setExpiringSoonOnly((v) => !v)}
              size="small"
              isActive={expiringSoonOnly}
              hasSelectedValues={expiringSoonOnly}
            />
          </FilterMenu>

          {/* Results Target Area */}
          <ThemedView className="flex-1">
            <DonationList
              donations={results}
              onCardPress={(id) => {
                const donation = donations.find((d) => d.id === id);
                const isOwner = donation?.createdBy === currentUserId;
                router.push({
                  pathname: isOwner ? "/donations/donation-details" : "/donations/donation-market-details",
                  params: { id },
                });
              }}
            />
          </ThemedView>

          {/* Bottom Sheet Modal Sheet Component */}
          <BottomSheet
            ref={filterModalRef}
            title={modalTitle}
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
