import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { VisibilityRuleType } from "@/shared/types/shared.types";

interface VisibilityTargetListProps {
  data: string[];
  selectedValues: string[];
  ruleType: VisibilityRuleType;
  searchable?: boolean;
  onToggle: (value: string) => void;
}

const getRuleIcon = (
  type: VisibilityRuleType,
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

// Generic sibling of
// features/rxrfqs/components/rxrfq-facility-searchlist.tsx — same
// layout/behavior, but a plain FlatList instead of BsFlatList (the
// platform-resolved wrapper around Gorhom's BottomSheetFlatList on
// native, which needs a real BottomSheetModal context to work — not
// safe to drop into a plain Modal, which is what
// add-rule-sheet.tsx uses). The rxrfq original stays untouched.
export const VisibilityTargetList: React.FC<VisibilityTargetListProps> = ({
  data,
  selectedValues,
  ruleType,
  searchable = false,
  onToggle,
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = searchable
    ? data.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : data;

  return (
    <View className="gap-1">
      {searchable && (
        <View
          className="flex-row items-center border rounded-lg px-2.5 py-2 gap-2 mb-1"
          style={{ backgroundColor: colors.border + "30", borderColor: colors.border }}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {searchable && filtered.length === 0 && (
        <View
          className="border border-dashed rounded-lg p-4 items-center gap-1.5 justify-center my-1"
          style={{ borderColor: colors.border }}
        >
          <MaterialCommunityIcons name="database-search-outline" size={22} color={colors.textSecondary + "80"} />
          <Text className="text-xs text-center" style={{ color: colors.textSecondary }}>
            No facilities match "{query}"
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={{ maxHeight: 260 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
                  name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text className="text-sm font-medium" style={{ color: isSelected ? colors.primary : colors.text }}>
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
