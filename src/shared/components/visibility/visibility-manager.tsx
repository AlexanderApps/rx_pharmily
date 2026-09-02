import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { VisibilityScope, VisibilityRule } from "@/shared/types/shared.types";
import { RulesBadgeList } from "@/shared/components/visibility/rules-badge-list";
import { AddVisibilityRuleSheet } from "@/shared/components/visibility/add-rule-sheet";

interface VisibilityManagerProps {
  scope: VisibilityScope;
  rules: VisibilityRule[];
  onScopeChange: (scope: VisibilityScope) => void;
  onAddRule: (rule: VisibilityRule) => void;
  onRemoveRule: (index: number) => void;
  error?: string;
}

// Generic sibling of
// features/rxrfqs/components/rxrfq-visibility-manager.tsx — same
// scope-toggle + rules-badge-list + add-rule-sheet shape, typed against
// the shared VisibilityScope/VisibilityRule types. donations and
// mediscope use this instead of duplicating rxrfq's own component a
// second and third time; rxrfq keeps using its own, untouched.
export const VisibilityManager: React.FC<VisibilityManagerProps> = ({
  scope,
  rules,
  onScopeChange,
  onAddRule,
  onRemoveRule,
  error,
}) => {
  const { colors } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <View className="w-full gap-2 my-1">
      <Text className="text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: colors.text }}>
        Marketplace Visibility
      </Text>

      <View className="flex-row p-1 rounded-lg h-11 items-center" style={{ backgroundColor: colors.border + "30" }}>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 h-full rounded-md"
          style={scope === "All" ? { backgroundColor: colors.backgroundElement } : undefined}
          onPress={() => onScopeChange("All")}
        >
          <MaterialCommunityIcons name="earth" size={16} color={scope === "All" ? colors.primary : colors.textSecondary} />
          <Text className="text-[13px] font-semibold" style={{ color: scope === "All" ? colors.text : colors.textSecondary }}>
            All Vendors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 h-full rounded-md"
          style={
            scope === "Restricted"
              ? { backgroundColor: colors.backgroundElement, borderColor: colors.error + "40", borderWidth: 1 }
              : undefined
          }
          onPress={() => onScopeChange("Restricted")}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={16}
            color={scope === "Restricted" ? colors.error : colors.textSecondary}
          />
          <Text className="text-[13px] font-semibold" style={{ color: scope === "Restricted" ? colors.text : colors.textSecondary }}>
            Restricted ACL
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text className="text-[11px] font-medium -mt-0.5" style={{ color: colors.error }}>{error}</Text>}

      {scope === "Restricted" && (
        <RulesBadgeList rules={rules} onRemoveRule={onRemoveRule} onAddPress={() => setIsSheetOpen(true)} />
      )}

      <AddVisibilityRuleSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        existingRules={rules}
        onAddRule={onAddRule}
      />
    </View>
  );
};
