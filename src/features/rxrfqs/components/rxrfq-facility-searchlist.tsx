import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
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
    <View style={styles.container}>
      {searchable && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.border + "30",
              borderColor: colors.border,
            },
          ]}
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
            style={[styles.searchInput, { color: colors.text }]}
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
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <MaterialCommunityIcons
            name="database-search-outline"
            size={22}
            color={colors.textSecondary + "80"}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No facilities match "{query}"
          </Text>
        </View>
      )}

      <BottomSheetFlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={[styles.list, { flex: 1, minHeight: 400, paddingBottom: 30 }]}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = selectedValues.includes(item);
          return (
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                isSelected && { backgroundColor: colors.primary + "10" },
              ]}
              onPress={() => onToggle(item)}
            >
              <View style={styles.rowInfo}>
                <MaterialCommunityIcons
                  name={
                    isSelected ? "checkbox-marked" : "checkbox-blank-outline"
                  }
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.rowText,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
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

const styles = StyleSheet.create({
  container: { gap: 4, flex: 1},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginVertical: 4,
  },
  emptyText: { fontSize: 12, textAlign: "center" },
  list: { maxHeight: 200, marginVertical: 4 },
  listFlex: { maxHeight: undefined, flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  rowInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 14, fontWeight: "500" },
});
