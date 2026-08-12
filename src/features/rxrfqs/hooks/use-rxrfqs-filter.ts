import { useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FilterType } from "@/features/rxrfqs/types/rxrfqs.types";

interface UseRxRfqsFiltersProps {
  filterModalRef: React.RefObject<BottomSheetModal | null>;
}

const REGION_OPTIONS = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
];

const CATEGORY_OPTIONS = [
  "Medications",
  "Consumables",
  "Test Kits",
  "Devices",
  "Stationery",
  "Others",
];

const PRICE_OPTIONS = [
  "Below GHS 50",
  "GHS 50 - 100",
  "GHS 100 - 500",
  "Above GHS 500",
];

const AVAILABILITY_OPTIONS = ["Available Only", "Out of Stock"];

export default function useRxRfqsFilters({
  filterModalRef,
}: UseRxRfqsFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  const [filters, setFilters] = useState({
    regions: [] as string[],
    categories: [] as string[],
    facilityTypes: [] as string[],
    // prices: [] as string[],
    // availability: [] as string[],
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
      // case "price":
      //   return ["40%"];
      // case "availability":
      //   return ["35%"];
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
      // case "price":
      //   return "Select Price";
      // case "availability":
      //   return "Availability";
      default:
        return "Filters";
    }
  }, [activeFilter]);

  // Replaced renderFilterContent with a configuration object getter
  const activeFilterConfig = useMemo(() => {
    switch (activeFilter) {
      case "region":
        return {
          options: REGION_OPTIONS,
          selectedOptions: filters.regions,
          onToggle: (val: string) => toggleFilterValue("regions", val),
        };
      case "category":
        return {
          options: CATEGORY_OPTIONS,
          selectedOptions: filters.categories,
          onToggle: (val: string) => toggleFilterValue("categories", val),
        };
      // case "price":
      //   return {
      //     options: PRICE_OPTIONS,
      //     selectedOptions: filters.prices,
      //     onToggle: (val: string) => toggleFilterValue("prices", val),
      //   };
      // case "availability":
      //   return {
      //     options: AVAILABILITY_OPTIONS,
      //     selectedOptions: filters.availability,
      //     onToggle: (val: string) => toggleFilterValue("availability", val),
      //   };
      default:
        return null;
    }
  }, [activeFilter, filters]);

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
