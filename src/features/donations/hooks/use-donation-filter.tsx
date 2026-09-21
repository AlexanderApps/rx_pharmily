import { useMemo, useState } from "react";
import { Keyboard } from "react-native";

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";

// "price" and "availability" (a hardcoded, four-option guess at stock
// status) are both dropped — donated items are free, a price filter
// never made sense for this feature to begin with, and "availability"
// had no connection to anything actually stored. "Expiring soon" (see
// expiringSoonOnly below) replaces it with something concrete and
// specific to donations: expiryDate is a real field on every donated
// item, and surfacing what's close to expiring is actual, useful
// urgency information a generic filter wouldn't give.
export type FilterType = "region" | "category";

interface UseDonationFiltersProps {
  filterModalRef: React.RefObject<BottomSheetModal | null>;
}

export default function useDonationFilters({
  filterModalRef,
}: UseDonationFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);

  // Region has a real, admin-managed reference table (same source
  // already used elsewhere in this app, e.g. the profile screens).
  // Category doesn't — donations has no equivalent to jobCategories/
  // rxrfqCategories, so its options are derived from whatever
  // categories are actually present on current donations, rather than
  // a fixed or hardcoded list that could drift from real data either
  // way.
  const regions = useReferenceDataStore((state) => state.regions);
  const donations = useDonationStore((state) => state.donations);
  const regionOptions = useMemo(() => regions.map((r) => r.name), [regions]);
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const donation of donations) {
      for (const category of donation.categories) seen.add(category);
    }
    return Array.from(seen).sort();
  }, [donations]);

  const [filters, setFilters] = useState({
    regions: [] as string[],
    categories: [] as string[],
  });

  const toggleFilterValue = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const values = prev[key];
      return {
        ...prev,
        [key]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  const openFilterModal = (filter: FilterType) => {
    Keyboard.dismiss();
    setActiveFilter(filter);
    setTimeout(() => {
      filterModalRef.current?.present();
    }, 50);
  };

  const snapPoints = useMemo(() => {
    switch (activeFilter) {
      case "region":
        return ["75%"];
      case "category":
        return ["55%"];
      default:
        return ["50%"];
    }
  }, [activeFilter]);

  const modalTitle = useMemo(() => {
    switch (activeFilter) {
      case "region":
        return "Select Region";
      case "category":
        return "Select Category";
      default:
        return "Filters";
    }
  }, [activeFilter]);

  const activeFilterConfig = useMemo(() => {
    switch (activeFilter) {
      case "region":
        return {
          options: regionOptions,
          selectedOptions: filters.regions,
          onToggle: (val: string) => toggleFilterValue("regions", val),
        };
      case "category":
        return {
          options: categoryOptions,
          selectedOptions: filters.categories,
          onToggle: (val: string) => toggleFilterValue("categories", val),
        };
      default:
        return null;
    }
  }, [activeFilter, filters, regionOptions, categoryOptions]);

  const clearActiveFilter = () => {
    setActiveFilter(null);
  };

  const closeFilterModal = () => {
    filterModalRef.current?.close();
    clearActiveFilter();
  };

  return {
    filters,
    activeFilter,
    snapPoints,
    modalTitle,
    activeFilterConfig,
    openFilterModal,
    clearActiveFilter,
    toggleFilterValue,
    closeFilterModal,
    expiringSoonOnly,
    setExpiringSoonOnly,
  };
}
