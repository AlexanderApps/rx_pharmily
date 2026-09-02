import React, { useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  RxRfqVisibilityScope,
  RxRfqVisibilityRule,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { RxRfqRulesBadgeList } from "@/features/rxrfqs/components/rxrfq-rules-badgelist";
import {
  RxRfqAddRuleSheet,
  RxRfqAddRuleSheetHandle,
} from "@/features/rxrfqs/components/rxrfq-add-rule-sheet";

interface VisibilityManagerProps {
  scope: RxRfqVisibilityScope;
  rules: RxRfqVisibilityRule[];
  onScopeChange: (scope: RxRfqVisibilityScope) => void;
  onAddRule: (rule: RxRfqVisibilityRule) => void;
  onRemoveRule: (index: number) => void;
  error?: string;
}

export const RxRfqVisibilityManager: React.FC<VisibilityManagerProps> = ({
  scope,
  rules,
  onScopeChange,
  onAddRule,
  onRemoveRule,
  error,
}) => {
  const { colors } = useTheme();
  const sheetRef = useRef<RxRfqAddRuleSheetHandle>(null);

  return (
    <View className="w-full gap-2 my-1">
      <Text className="text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: colors.text }}>
        Marketplace Visibility
      </Text>

      {/* Scope toggle */}
      <View
        className="flex-row p-1 rounded-lg h-11 items-center"
        style={{ backgroundColor: colors.border + "30" }}
      >
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 h-full rounded-md"
          style={scope === "All" ? { backgroundColor: colors.backgroundElement } : undefined}
          onPress={() => onScopeChange("All")}
        >
          <MaterialCommunityIcons
            name="earth"
            size={16}
            color={scope === "All" ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: scope === "All" ? colors.text : colors.textSecondary }}
          >
            All Vendors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 h-full rounded-md"
          style={
            scope === "Restricted"
              ? {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.error + "40",
                  borderWidth: 1,
                }
              : undefined
          }
          onPress={() => onScopeChange("Restricted")}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={16}
            color={scope === "Restricted" ? colors.error : colors.textSecondary}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{
              color: scope === "Restricted" ? colors.text : colors.textSecondary,
            }}
          >
            Restricted ACL
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text className="text-[11px] font-medium -mt-0.5" style={{ color: colors.error }}>{error}</Text>
      )}

      {/* Rules list — only visible in Restricted mode */}
      {scope === "Restricted" && (
        <RxRfqRulesBadgeList
          rules={rules}
          onRemoveRule={onRemoveRule}
          onAddPress={() => sheetRef.current?.open()}
        />
      )}

      {/* Bottom sheet — always mounted so it can be imperatively opened */}
      <RxRfqAddRuleSheet
        ref={sheetRef}
        existingRules={rules}
        onAddRule={onAddRule}
      />
    </View>
  );
};

