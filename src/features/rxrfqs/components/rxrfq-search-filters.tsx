import FilterMenu from "@/shared/components/filter-menu";
import FilterButton from "@/shared/components/filter-button";
import { RfqsFilter, FilterType } from "@/features/rxrfqs/types/rxrfqs.types";

export type RfqsFilters = Record<RfqsFilter, string[]>;

export interface RfqsFilterMenuProps {
  activeFilter: FilterType | null;
  openFilterModal: (filter: FilterType) => void;
  filters: RfqsFilters;
}

const RfqsFilterMenu = ({
  activeFilter,
  openFilterModal,
  filters,
}: RfqsFilterMenuProps) => {
  return (
    <FilterMenu>
      <FilterButton
        label="Region"
        onPress={() => openFilterModal("region")}
        isActive={activeFilter === "region"}
        hasSelectedValues={filters.regions.length > 0}
        badge={filters.regions.length || undefined}
      />

      <FilterButton
        label="Category"
        onPress={() => openFilterModal("category")}
        isActive={activeFilter === "category"}
        hasSelectedValues={filters.categories.length > 0}
        badge={filters.categories.length || undefined}
      />

      {/*<FilterButton
        label="Price"
        onPress={() => openFilterModal("price")}
        isActive={activeFilter === "price"}
        hasSelectedValues={filters.prices.length > 0}
        badge={filters.prices.length || undefined}
      />*/}
    </FilterMenu>
  );
};

export default RfqsFilterMenu;
