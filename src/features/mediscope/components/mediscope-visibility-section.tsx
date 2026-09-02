import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
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
    <View className="gap-2.5">
      <View className="flex-row flex-wrap gap-2">
        {(["All", "Restricted"] as MediscopeVisibilityScope[]).map((option) => {
          const active = scope === option;
          return (
            <Pressable
              key={option}
              onPress={() => onScopeChange(option)}
              className="px-3.5 py-2 rounded-full"
              style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                {option === "All" ? "Everyone" : "Restricted"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {scope === "Restricted" && (
        <View className="gap-2">
          {rules.map((rule) => (
            <View
              key={rule.id}
              className="flex-row items-center gap-2 border rounded-lg px-2.5 py-2"
              style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border }}
            >
              <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={colors.textSecondary} />
              <Text className="text-xs flex-1" style={{ color: colors.text }} numberOfLines={1}>
                {rule.ruleType}: {ruleLabel(rule)}
              </Text>
              <Pressable onPress={() => removeRule(rule.id)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={15} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}

          <View className="flex-row flex-wrap gap-2">
            {RULE_TYPES.map((type) => {
              const active = draftType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setDraftType(type)}
                  className="px-2.5 py-1.5 rounded-full"
                  style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                >
                  <Text className="text-[11px] font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-2 items-center">
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
              className="flex-1 border rounded-lg px-3 py-2.5 text-[13px]"
              style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              onSubmitEditing={addRule}
              returnKeyType="done"
            />
            <Pressable onPress={addRule} className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: colors.text }}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.backgroundSecondary} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default MediscopeVisibilitySection;

