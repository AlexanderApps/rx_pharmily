import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  MediscopeVisibilityRule,
  MediscopeVisibilityRuleType,
  MediscopeVisibilityScope,
} from "@/features/mediscope/types/mediscope.types";

interface MediscopeVisibilitySectionProps {
  scope: MediscopeVisibilityScope;
  rules: MediscopeVisibilityRule[];
  onScopeChange: (scope: MediscopeVisibilityScope) => void;
  onRulesChange: (rules: MediscopeVisibilityRule[]) => void;
}

const RULE_TYPES: MediscopeVisibilityRuleType[] = [
  "Region",
  "Facility Type",
  "Specific Facility",
];

let nextDraftId = 1;

const MediscopeVisibilitySection: React.FC<MediscopeVisibilitySectionProps> = ({
  scope,
  rules,
  onScopeChange,
  onRulesChange,
}) => {
  const { colors } = useTheme();
  const [draftType, setDraftType] = useState<MediscopeVisibilityRuleType>("Region");
  const [draftValue, setDraftValue] = useState("");

  const addRule = () => {
    if (!draftValue.trim()) return;
    const rule: MediscopeVisibilityRule = {
      id: `draft-${nextDraftId++}`,
      ruleType: draftType,
      region: draftType === "Region" ? draftValue.trim() : undefined,
      facilityType: draftType === "Facility Type" ? draftValue.trim() : undefined,
      facility: draftType === "Specific Facility" ? draftValue.trim() : undefined,
    };
    onRulesChange([...rules, rule]);
    setDraftValue("");
  };

  const removeRule = (id?: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const ruleLabel = (rule: MediscopeVisibilityRule) =>
    rule.region || rule.facilityType || rule.facility || "";

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.chipRow}>
        {(["All", "Restricted"] as MediscopeVisibilityScope[]).map((option) => {
          const active = scope === option;
          return (
            <Pressable
              key={option}
              onPress={() => onScopeChange(option)}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                {option === "All" ? "Everyone" : "Restricted"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {scope === "Restricted" && (
        <View style={{ gap: 8 }}>
          {rules.map((rule) => (
            <View
              key={rule.id}
              style={[styles.ruleRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.ruleText, { color: colors.text }]} numberOfLines={1}>
                {rule.ruleType}: {ruleLabel(rule)}
              </Text>
              <Pressable onPress={() => removeRule(rule.id)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={15} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}

          <View style={styles.chipRow}>
            {RULE_TYPES.map((type) => {
              const active = draftType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setDraftType(type)}
                  style={[
                    styles.smallChip,
                    { backgroundColor: active ? colors.primary : colors.backgroundElement },
                  ]}
                >
                  <Text style={[styles.smallChipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.addRow}>
            <TextInput
              value={draftValue}
              onChangeText={setDraftValue}
              placeholder={
                draftType === "Region"
                  ? "e.g. Greater Accra"
                  : draftType === "Facility Type"
                    ? "e.g. Hospital"
                    : "e.g. Ridge Hospital"
              }
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.addInput,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
              ]}
              onSubmitEditing={addRule}
              returnKeyType="done"
            />
            <Pressable onPress={addRule} style={[styles.addButton, { backgroundColor: colors.text }]}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.backgroundSecondary} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default MediscopeVisibilitySection;

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  smallChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  smallChipText: { fontSize: 11, fontWeight: "600" },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ruleText: { fontSize: 12, flex: 1 },
  addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  addButton: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
