import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { RxRfqRuleTypeSelector } from "@/features/rxrfqs/components/rxrfq-rule-type-selector";
import { RxRfqFacilitySearchList } from "@/features/rxrfqs/components/rxrfq-facility-searchlist";
import {
  RxRfqVisibilityRule,
  RxRfqVisibilityRuleType,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { FACILITY_TYPES } from "@/features/profile/types/profile.types";

export interface RxRfqAddRuleSheetHandle {
  open: () => void;
}

interface RxRfqAddRuleSheetProps {
  existingRules: RxRfqVisibilityRule[];
  onAddRule: (rule: RxRfqVisibilityRule) => void;
}

export const RxRfqAddRuleSheet = forwardRef<
  RxRfqAddRuleSheetHandle,
  RxRfqAddRuleSheetProps
>(({ existingRules, onAddRule }, ref) => {
  const { colors } = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], []);
  const regions = useReferenceDataStore((state) => state.regions);
  const facilities = useProfileStore((state) => state.facilities);

  const [selectedRuleType, setSelectedRuleType] =
    useState<RxRfqVisibilityRuleType>("Region");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    open: () => {
      setSelectedRuleType("Region");
      setSelectedValues([]);
      modalRef.current?.present();
    },
  }));

  const handleRuleTypeChange = (type: RxRfqVisibilityRuleType) => {
    setSelectedRuleType(type);
    setSelectedValues([]);
  };

  const handleToggleValue = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleSave = () => {
    if (selectedValues.length === 0) return;

    selectedValues.forEach((value) => {
      const isDuplicate = existingRules.some((existing) => {
        if (existing.ruleType !== selectedRuleType) return false;
        return (
          existing.region === value ||
          existing.facilityType === value ||
          existing.facility === value
        );
      });

      if (!isDuplicate) {
        const newRule: RxRfqVisibilityRule = {
          ruleType: selectedRuleType,
          ...(selectedRuleType === "Region" && { region: value }),
          ...(selectedRuleType === "Facility Type" && { facilityType: value }),
          ...(selectedRuleType === "Specific Facility" && { facility: value }),
        };
        onAddRule(newRule);
      }
    });

    modalRef.current?.dismiss();
  };

  const currentData = useMemo(() => {
    if (selectedRuleType === "Region") return regions.map((r) => r.name);
    if (selectedRuleType === "Facility Type") return FACILITY_TYPES;
    // All facilities, not just the current user's own — this rule is
    // restricting an RFQ's visibility to specific *other* facilities,
    // so the full facilities list (already fetched globally, same as
    // regions) is the correct source here, not getMyFacilities().
    return facilities.map((f) => f.name);
  }, [selectedRuleType, regions, facilities]);

  return (
    <BottomSheet
      ref={modalRef}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={16}
      padding={20}
      enablePanDownToClose
      backgroundColor={colors.backgroundSecondary}
    >
      {/* Outer flex column — fills the full sheet height */}
      <View className="flex-1 flex-col p-5">
        {/* Fixed header: title + step labels + type selector */}
        <View className="shrink-0">
          <Text className="text-base font-bold text-center" style={{ color: colors.text }}>
            Add Target Restriction Filters
          </Text>

          <Text
            className="text-[11px] font-bold tracking-[1px] mb-1.5 mt-3"
            style={{ color: colors.textSecondary }}
          >
            1. SELECT CRITERIA TYPE
          </Text>
          <RxRfqRuleTypeSelector
            selected={selectedRuleType}
            onSelect={handleRuleTypeChange}
          />

          <Text
            className="text-[11px] font-bold tracking-[1px] mb-1.5 mt-4"
            style={{ color: colors.textSecondary }}
          >
            2. MULTI-SELECT MATCHING TARGETS ({selectedValues.length})
          </Text>
        </View>

        {/* Expanding list — takes all remaining vertical space */}
        <View className="flex-1 my-1 mb-5">
          <RxRfqFacilitySearchList
            data={currentData}
            selectedValues={selectedValues}
            ruleType={selectedRuleType}
            searchable={selectedRuleType === "Specific Facility"}
            onToggle={handleToggleValue}
            // flex
          />
        </View>

        {/* Button pinned to bottom */}
        <TouchableOpacity
          className="shrink-0 py-3.5 rounded-md items-center mt-2 mb-2"
          style={{
            backgroundColor:
              selectedValues.length === 0 ? colors.border : colors.primary,
          }}
          onPress={handleSave}
          disabled={selectedValues.length === 0}
        >
          <Text className="text-white font-semibold text-sm">
            {selectedValues.length > 0
              ? `Add Selected Rules (${selectedValues.length})`
              : "Select Options"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
});

RxRfqAddRuleSheet.displayName = "RxRfqAddRuleSheet";

