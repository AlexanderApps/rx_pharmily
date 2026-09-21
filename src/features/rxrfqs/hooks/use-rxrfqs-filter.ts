import { useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FilterType } from "@/features/rxrfqs/types/rxrfqs.types";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

interface UseRxRfqsFiltersProps {
  filterModalRef: React.RefObject<BottomSheetModal | null>;
}

export default function useRxRfqsFilters({
  filterModalRef,
}: UseRxRfqsFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  // Real, admin-managed reference data (same source jobs' own working
  // filter already uses for jobCategories) — not the hardcoded, stale
  // option lists this hook used to carry, which had no connection to
  // what's actually stored anywhere and could silently drift from it.
  const regions = useReferenceDataStore((state) => state.regions);
  const rxrfqCategories = useReferenceDataStore((state) => state.rxrfqCategories);
  const regionOptions = useMemo(() => regions.map((r) => r.name), [regions]);
  const categoryOptions = useMemo(() => rxrfqCategories.map((c) => c.name), [rxrfqCategories]);

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
  };
}
