import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { VisibilityRule, VisibilityRuleType } from "@/shared/types/shared.types";
import { RxRfqRuleTypeSelector } from "@/features/rxrfqs/components/rxrfq-rule-type-selector";
import { VisibilityTargetList } from "@/shared/components/visibility/target-list";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { FACILITY_TYPES } from "@/features/profile/types/profile.types";

interface AddVisibilityRuleSheetProps {
  visible: boolean;
  onClose: () => void;
  existingRules: VisibilityRule[];
  onAddRule: (rule: VisibilityRule) => void;
}

// Generic sibling of features/rxrfqs/components/rxrfq-add-rule-sheet.tsx
// — same rule-building logic and the same real data sources (regions,
// facility types, facilities — no more MOCK_REGIONS-style hardcoded
// lists), but a centered Modal instead of a BottomSheet. Deliberate,
// not an oversight: this nests RxRfqFacilitySearchList, a searchable
// list, which is exactly the "should be a Dialog" case from the earlier
// sheet/modal audit — and since this is new code (not a retrofit of
// working rxrfq code), there's no reason to start it off as a Sheet just
// to match rxrfq's own not-yet-migrated version.
export const AddVisibilityRuleSheet: React.FC<AddVisibilityRuleSheetProps> = ({
  visible,
  onClose,
  existingRules,
  onAddRule,
}) => {
  const { colors } = useTheme();
  const regions = useReferenceDataStore((state) => state.regions);
  const facilities = useProfileStore((state) => state.facilities);

  const [selectedRuleType, setSelectedRuleType] = useState<VisibilityRuleType>("Region");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const resetAndClose = () => {
    setSelectedRuleType("Region");
    setSelectedValues([]);
    onClose();
  };

  const handleRuleTypeChange = (type: VisibilityRuleType) => {
    setSelectedRuleType(type);
    setSelectedValues([]);
  };

  const handleToggleValue = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleSave = () => {
    if (selectedValues.length === 0) return;

    selectedValues.forEach((value) => {
      const isDuplicate = existingRules.some((existing) => {
        if (existing.ruleType !== selectedRuleType) return false;
        return existing.region === value || existing.facilityType === value || existing.facility === value;
      });

      if (!isDuplicate) {
        const newRule: VisibilityRule = {
          ruleType: selectedRuleType,
          ...(selectedRuleType === "Region" && { region: value }),
          ...(selectedRuleType === "Facility Type" && { facilityType: value }),
          ...(selectedRuleType === "Specific Facility" && { facility: value }),
        };
        onAddRule(newRule);
      }
    });

    resetAndClose();
  };

  // Same source-per-rule-type as rxrfq-add-rule-sheet.tsx: the real
  // regions table, the shared FACILITY_TYPES list, and every facility
  // (not just the current user's own — this restricts visibility to
  // specific *other* facilities).
  const currentData = useMemo(() => {
    if (selectedRuleType === "Region") return regions.map((r) => r.name);
    if (selectedRuleType === "Facility Type") return FACILITY_TYPES;
    return facilities.map((f) => f.name);
  }, [selectedRuleType, regions, facilities]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <Pressable
        className="flex-1 items-center justify-center p-6"
        onPress={resetAndClose}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full" style={{ maxWidth: 480 }}>
          <View
            className="rounded-2xl p-5 gap-1"
            style={{ backgroundColor: colors.backgroundSecondary, maxHeight: "80%" }}
          >
            <Text className="text-base font-bold text-center" style={{ color: colors.text }}>
              Add Target Restriction Filters
            </Text>

            <Text
              className="text-[11px] font-bold tracking-[1px] mb-1.5 mt-3"
              style={{ color: colors.textSecondary }}
            >
              1. SELECT CRITERIA TYPE
            </Text>
            <RxRfqRuleTypeSelector selected={selectedRuleType} onSelect={handleRuleTypeChange} />

            <Text
              className="text-[11px] font-bold tracking-[1px] mb-1.5 mt-4"
              style={{ color: colors.textSecondary }}
            >
              2. MULTI-SELECT MATCHING TARGETS ({selectedValues.length})
            </Text>

            <VisibilityTargetList
              data={currentData}
              selectedValues={selectedValues}
              ruleType={selectedRuleType}
              searchable={selectedRuleType === "Specific Facility"}
              onToggle={handleToggleValue}
            />

            <Pressable
              className="py-3.5 rounded-md items-center mt-3"
              style={{ backgroundColor: selectedValues.length === 0 ? colors.border : colors.primary }}
              onPress={handleSave}
              disabled={selectedValues.length === 0}
            >
              <Text className="text-white font-semibold text-sm">
                {selectedValues.length > 0
                  ? `Add Selected Rules (${selectedValues.length})`
                  : "Select Options"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
