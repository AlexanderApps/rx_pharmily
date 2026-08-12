import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { RxRfqRuleTypeSelector } from "@/features/rxrfqs/components/rxrfq-rule-type-selector";
import { RxRfqFacilitySearchList } from "@/features/rxrfqs/components/rxrfq-facility-searchlist";
import {
  RxRfqVisibilityRule,
  RxRfqVisibilityRuleType,
} from "@/features/rxrfqs/types/rxrfqs.types";

// ---------------------------------------------------------------------------
// Mock data — swap these out for API calls when ready
// ---------------------------------------------------------------------------
const MOCK_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Northern",
  "Central",
  "Eastern",
];

const MOCK_FACILITY_TYPES = [
  "Wholesale",
  "Retail Pharmacy",
  "Public Hospital",
  "Private Lab",
];

const MOCK_FACILITIES = [
  "Korle-Bu Teaching Hospital Depot",
  "Komfo Anokye Central Store",
  "Accra Lab Diagnostics Centre",
  "MedPharma Wholesale Ltd",
  "Ridge Hospital Supply Unit",
  "Greater Accra Regional Hospital Store",
  "Tema General Hospital Pharmacy",
  "37 Military Hospital Depot",
  "La General Hospital",
  "Cocoa Clinic Dispensary",
  "Legon Hospital Store",
  "University of Ghana Medical Centre",
  "KATH Pharmaceutical Store",
  "Okomfo Anokye Medical Supplies",
  "Cape Coast Teaching Hospital Depot",
];
// ---------------------------------------------------------------------------

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
    if (selectedRuleType === "Region") return MOCK_REGIONS;
    if (selectedRuleType === "Facility Type") return MOCK_FACILITY_TYPES;
    return MOCK_FACILITIES;
  }, [selectedRuleType]);

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
      <View style={styles.sheetBody}>
        {/* Fixed header: title + step labels + type selector */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>
            Add Target Restriction Filters
          </Text>

          <Text
            style={[
              styles.stepLabel,
              { color: colors.textSecondary, marginTop: 12 },
            ]}
          >
            1. SELECT CRITERIA TYPE
          </Text>
          <RxRfqRuleTypeSelector
            selected={selectedRuleType}
            onSelect={handleRuleTypeChange}
          />

          <Text
            style={[
              styles.stepLabel,
              { color: colors.textSecondary, marginTop: 16 },
            ]}
          >
            2. MULTI-SELECT MATCHING TARGETS ({selectedValues.length})
          </Text>
        </View>

        {/* Expanding list — takes all remaining vertical space */}
        <View style={styles.listBlock}>
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
          style={[
            styles.saveButton,
            {
              backgroundColor:
                selectedValues.length === 0 ? colors.border : colors.primary,
            },
          ]}
          onPress={handleSave}
          disabled={selectedValues.length === 0}
        >
          <Text style={styles.saveButtonText}>
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

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
    flexDirection: "column",
    padding: 20,
  },
  headerBlock: {
    flexShrink: 0,
  },
  listBlock: {
    flex: 1,
    marginVertical: 4,
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  saveButton: {
    flexShrink: 0,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
