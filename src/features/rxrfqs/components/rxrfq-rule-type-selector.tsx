import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqVisibilityRuleType } from "@/features/rxrfqs/types/rxrfqs.types";

const RULE_TYPES: RxRfqVisibilityRuleType[] = [
  "Region",
  "Facility Type",
  "Specific Facility",
];

interface RxRfqRuleTypeSelectorProps {
  selected: RxRfqVisibilityRuleType;
  onSelect: (type: RxRfqVisibilityRuleType) => void;
}

export const RxRfqRuleTypeSelector: React.FC<RxRfqRuleTypeSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {RULE_TYPES.map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.button,
            { borderColor: "rgba(128,128,128,0.3)" },
            selected === type && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => onSelect(type)}
        >
          <Text
            style={[
              styles.buttonText,
              { color: selected === type ? "#fff" : colors.text },
            ]}
          >
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginVertical: 4 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  buttonText: { fontSize: 11, fontWeight: "600" },
});
