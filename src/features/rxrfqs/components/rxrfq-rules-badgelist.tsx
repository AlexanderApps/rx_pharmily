import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import InlineEmptyNotice from "@/shared/components/inline-empty-notice";
import {
  RxRfqVisibilityRule,
  RxRfqVisibilityRuleType,
} from "@/features/rxrfqs/types/rxrfqs.types";

interface RxRfqRulesBadgeListProps {
  rules: RxRfqVisibilityRule[];
  onRemoveRule: (index: number) => void;
  onAddPress: () => void;
}

const getRuleLabel = (rule: RxRfqVisibilityRule) =>
  rule.region || rule.facilityType || rule.facility || "Unknown";

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

export const RxRfqRulesBadgeList: React.FC<RxRfqRulesBadgeListProps> = ({
  rules,
  onRemoveRule,
  onAddPress,
}) => {
  const { colors } = useTheme();

  return (
    <View className="mt-2 gap-2.5">
      {/* Header row */}
      <View className="flex-row justify-between items-center">
        <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
          Configured Criteria Rules ({rules.length})
        </Text>
        <TouchableOpacity
          className="flex-row items-center px-2.5 py-1.5 rounded-md gap-1"
          style={{ backgroundColor: colors.primary + "15" }}
          onPress={onAddPress}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={colors.primary}
          />
          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
            Add Target Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {rules.length === 0 ? (
        <InlineEmptyNotice
          icon="alert-circle-outline"
          message="No restrictions assigned yet. Select criteria targets above."
        />
      ) : (
        /* Badge chips */
        <View className="flex-row flex-wrap gap-2">
          {rules.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center px-2.5 py-2 rounded-full border-[0.5px] gap-1.5"
              style={{
                backgroundColor: colors.border + "40",
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name={getRuleIcon(item.ruleType)}
                size={14}
                color={colors.text}
              />
              <Text className="text-xs" style={{ color: colors.text }}>
                <Text style={{ fontWeight: "700" }}>{item.ruleType}:</Text>{" "}
                {getRuleLabel(item)}
              </Text>
              <TouchableOpacity onPress={() => onRemoveRule(index)} hitSlop={6}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

