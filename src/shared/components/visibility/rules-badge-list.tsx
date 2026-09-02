import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { VisibilityRule, VisibilityRuleType } from "@/shared/types/shared.types";

interface RulesBadgeListProps {
  rules: VisibilityRule[];
  onRemoveRule: (index: number) => void;
  onAddPress: () => void;
}

const getRuleLabel = (rule: VisibilityRule) =>
  rule.region || rule.facilityType || rule.facility || "Unknown";

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

// Generic sibling of features/rxrfqs/components/rxrfq-rules-badgelist.tsx
// — same layout/behavior, typed against the shared VisibilityRule shape
// instead of RxRfqVisibilityRule, so donations/mediscope don't need to
// duplicate this. rxrfq keeps using its own original component,
// untouched.
export const RulesBadgeList: React.FC<RulesBadgeListProps> = ({
  rules,
  onRemoveRule,
  onAddPress,
}) => {
  const { colors } = useTheme();

  return (
    <View className="mt-2 gap-2.5">
      <View className="flex-row justify-between items-center">
        <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
          Configured Criteria Rules ({rules.length})
        </Text>
        <TouchableOpacity
          className="flex-row items-center px-2.5 py-1.5 rounded-md gap-1"
          style={{ backgroundColor: colors.primary + "15" }}
          onPress={onAddPress}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
            Add Target Filters
          </Text>
        </TouchableOpacity>
      </View>

      {rules.length === 0 ? (
        <View
          className="border border-dashed rounded-lg p-4 items-center gap-1.5 justify-center"
          style={{ borderColor: colors.border }}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={24}
            color={colors.textSecondary + "80"}
          />
          <Text className="text-xs text-center max-w-[85%]" style={{ color: colors.textSecondary }}>
            No restrictions assigned yet. Select criteria targets above.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {rules.map((item, index) => (
            <View
              key={item.id ?? index}
              className="flex-row items-center px-2.5 py-2 rounded-full border-[0.5px] gap-1.5"
              style={{ backgroundColor: colors.border + "40", borderColor: colors.border }}
            >
              <MaterialCommunityIcons name={getRuleIcon(item.ruleType)} size={14} color={colors.text} />
              <Text className="text-xs" style={{ color: colors.text }}>
                <Text style={{ fontWeight: "700" }}>{item.ruleType}:</Text> {getRuleLabel(item)}
              </Text>
              <TouchableOpacity onPress={() => onRemoveRule(index)} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
