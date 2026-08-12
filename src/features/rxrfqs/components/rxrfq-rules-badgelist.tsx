import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
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
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Configured Criteria Rules ({rules.length})
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary + "15" }]}
          onPress={onAddPress}
        >
          <MaterialCommunityIcons
            name="plus"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            Add Target Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {rules.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={24}
            color={colors.textSecondary + "80"}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No restrictions assigned yet. Select criteria targets above.
          </Text>
        </View>
      ) : (
        /* Badge chips */
        <View style={styles.badgeWrapper}>
          {rules.map((item, index) => (
            <View
              key={index}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.border + "40",
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getRuleIcon(item.ruleType)}
                size={14}
                color={colors.text}
              />
              <Text style={[styles.badgeText, { color: colors.text }]}>
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

const styles = StyleSheet.create({
  container: { marginTop: 8, gap: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subLabel: { fontSize: 12, fontWeight: "500" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: { fontSize: 12, fontWeight: "600" },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  emptyText: { fontSize: 12, textAlign: "center", maxWidth: "85%" },
  badgeWrapper: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    gap: 6,
  },
  badgeText: { fontSize: 12 },
});
