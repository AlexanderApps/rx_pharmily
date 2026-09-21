import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, TextInput, Platform} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/shared/components/themed-view";
import BottomSheet from "@/shared/components/bottom-sheet";
import CheckboxFilterGroup from "@/shared/components/checkbox-filter-group";
import RxRfqList from "@/features/rxrfqs/components/rxrfq-list-container";

import { useTheme } from "@/shared/hooks/use-theme";
import useRxRfqsFilters from "@/features/rxrfqs/hooks/use-rxrfqs-filter";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import Ionicons from "@expo/vector-icons/Ionicons";
import Input from "@/shared/components/input";
import RfqsFilterMenu from "@/features/rxrfqs/components/rxrfq-search-filters";

export default function SearchRfqsContent() {
  const filterModalRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const { colors } = useTheme();
  const rxrfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const rxrfqs = useRxRfqsStore((state) => state.rxrfqs);
  const facilities = useProfileStore((state) => state.facilities);
  const {
    activeFilterConfig,
    modalTitle,
    snapPoints,
    openFilterModal,
    filters,
    activeFilter,
    clearActiveFilter,
  } = useRxRfqsFilters({
    filterModalRef,
  });

  // Auto focus search input on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  // categories lives on the full market-place record, not on the
  // resolved card shape (RxRfqCardData) rxrfqs holds — this map lets
  // the category filter below check it without changing what
  // RxRfqList itself expects to render.
  const categoriesById = useMemo(
    () => new Map(rxrfqMarketPlace.map((rfq) => [rfq.id, rfq.categories])),
    [rxrfqMarketPlace],
  );

  // Region filtering needs the facility's actual region field, not
  // facilityLocation (resolved from facility.location, an address/GPS-
  // style string) — comparing a selected region name against that
  // would almost never match. rxrfqMarketPlace carries facilityId,
  // which this maps through to each facility's real region.
  const facilityIdByRfqId = useMemo(
    () => new Map(rxrfqMarketPlace.map((rfq) => [rfq.id, rfq.facilityId])),
    [rxrfqMarketPlace],
  );
  const regionByFacilityId = useMemo(
    () => new Map(facilities.map((f) => [f.id, f.region])),
    [facilities],
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rxrfqs.filter((rfq) => {
      if (rfq.isRemoved || rfq.status !== "published") return false;
      if (filters.regions.length > 0) {
        const facilityId = facilityIdByRfqId.get(rfq.id);
        const region = facilityId ? regionByFacilityId.get(facilityId) : undefined;
        if (!region || !filters.regions.includes(region)) return false;
      }
      if (filters.categories.length > 0) {
        const categories = categoriesById.get(rfq.id) ?? [];
        if (!filters.categories.some((c) => categories.includes(c))) return false;
      }
      if (!q) return true;
      return (
        rfq.code.toLowerCase().includes(q) ||
        rfq.facilityName.toLowerCase().includes(q) ||
        rfq.facilityLocation.toLowerCase().includes(q)
      );
    });
  }, [rxrfqs, search, filters, categoriesById, facilityIdByRfqId, regionByFacilityId]);

  return (
    <ThemedView className="flex-1">
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
            {Platform.OS !== "web" && (
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
            )}

            {/* Search */}
            <ThemedView
              style={{
                flex: 1,
              }}
            >
              <Input
                ref={searchInputRef}
                placeholder="Search RFQs..."
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
          <RfqsFilterMenu
            activeFilter={activeFilter}
            openFilterModal={openFilterModal}
            filters={filters}
          />

          {/* Content */}
          <ThemedView style={{ flex: 1 }}>
            <RxRfqList
              rfqs={results}
              onCardPress={(id) =>
                router.push({
                  pathname: "/rfqs/rxrfq-market-details",
                  params: { id },
                })
              }
            />
          </ThemedView>

          {/* Bottom Sheet Modal */}
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
