import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
    <View className="flex-row gap-2 my-1">
      {RULE_TYPES.map((type) => (
        <TouchableOpacity
          key={type}
          className="flex-1 py-2.5 rounded-md border items-center"
          style={{
            borderColor: "rgba(128,128,128,0.3)",
            ...(selected === type && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }),
          }}
          onPress={() => onSelect(type)}
        >
          <Text
            className="text-[11px] font-semibold"
            style={{ color: selected === type ? "#fff" : colors.text }}
          >
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

