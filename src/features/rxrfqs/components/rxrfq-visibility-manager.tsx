import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        Marketplace Visibility
      </Text>

      {/* Scope toggle */}
      <View
        style={[
          styles.segmentContainer,
          { backgroundColor: colors.border + "30" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.segmentButton,
            scope === "All" && { backgroundColor: colors.backgroundElement },
          ]}
          onPress={() => onScopeChange("All")}
        >
          <MaterialCommunityIcons
            name="earth"
            size={16}
            color={scope === "All" ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              { color: scope === "All" ? colors.text : colors.textSecondary },
            ]}
          >
            All Vendors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            scope === "Restricted" && {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.error + "40",
              borderWidth: 1,
            },
          ]}
          onPress={() => onScopeChange("Restricted")}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={16}
            color={scope === "Restricted" ? colors.error : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  scope === "Restricted" ? colors.text : colors.textSecondary,
              },
            ]}
          >
            Restricted ACL
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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

const styles = StyleSheet.create({
  container: { width: "100%", gap: 8, marginVertical: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 8,
    height: 44,
    alignItems: "center",
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: "100%",
    borderRadius: 6,
  },
  segmentText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 11, fontWeight: "500", marginTop: -2 },
});
