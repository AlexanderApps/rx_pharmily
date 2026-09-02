import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import InlineEmptyNotice from "@/shared/components/inline-empty-notice";
import { RxRfqVisibilityRuleType } from "@/features/rxrfqs/types/rxrfqs.types";
import { BsFlatList as BottomSheetFlatList } from "@/shared/components/bs/bs-primitives";

interface RxRfqFacilitySearchListProps {
  /** Full dataset to filter over. Pass API results or mock data. */
  data: string[];
  selectedValues: string[];
  /** Rule type drives the icon shown next to each row */
  ruleType: RxRfqVisibilityRuleType;
  /** Whether to show the search bar — true only for Specific Facility */
  searchable?: boolean;
  /**
   * When true the list removes its internal maxHeight and fills whatever
   * flex space the parent provides. Use this when the parent is a flex:1
   * container (e.g. inside the bottom sheet body).
   */
  flex?: boolean;
  onToggle: (value: string) => void;
}

const getRuleIcon = (
  type: RxRfqVisibilityRuleType,
): React.ComponentProps<typeof MaterialCommunityIcons>["name"] => {
  switch (type) {
    case "Region":
      return "map-marker-radius-outline";
    case "Facility Type":
      return "domain";
    case "Specific Facility":
      return "hospital-building";
  }
};

export const RxRfqFacilitySearchList: React.FC<
  RxRfqFacilitySearchListProps
> = ({
  data,
  selectedValues,
  ruleType,
  searchable = false,
  flex = false,
  onToggle,
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = searchable
    ? data.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : data;

  return (
    <View className="gap-1 flex-1">
      {searchable && (
        <View
          className="flex-row items-center border rounded-lg px-2.5 py-2 gap-2 mb-1"
          style={{
            backgroundColor: colors.border + "30",
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search facilities..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-sm py-0"
            style={{ color: colors.text }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={6}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {searchable && filtered.length === 0 && (
        <View className="my-1">
          <InlineEmptyNotice
            icon="database-search-outline"
            iconSize={22}
            message={`No facilities match "${query}"`}
          />
        </View>
      )}

      <BottomSheetFlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={{ maxHeight: 200, marginVertical: 4, flex: 1, minHeight: 400, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = selectedValues.includes(item);
          return (
            <TouchableOpacity
              className="flex-row justify-between items-center py-3 px-2 border-b-[0.5px]"
              style={{
                borderBottomColor: colors.border,
                backgroundColor: isSelected ? colors.primary + "10" : "transparent",
              }}
              onPress={() => onToggle(item)}
            >
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons
                  name={
                    isSelected ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: isSelected ? colors.primary : colors.text }}
                >
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

