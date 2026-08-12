import React from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ActiveCheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

const ActiveCheckbox: React.FC<ActiveCheckboxProps> = ({
  value,
  onChange,
  label = "Active",
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: value
            ? colors.success + "15"
            : colors.backgroundElement,
          borderColor: value ? colors.success : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => onChange(!value)}
    >
      {/* Checkbox (Matches previous square checkbox style guide) */}
      <View
        style={[
          styles.checkbox,
          { borderColor: colors.border },
          value && {
            backgroundColor: colors.success,
            borderColor: colors.success,
          },
        ]}
      >
        {value && (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={colors.backgroundSecondary} // Sharp vector contrast cut
          />
        )}
      </View>

      {/* Label Text */}
      <Text
        style={[
          styles.label,
          { color: value ? colors.success : colors.textSecondary },
        ]}
      >
        {label}
      </Text>

      {/* Modern Pill Badge */}
      {value && (
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Text
            style={[styles.badgeText, { color: colors.backgroundSecondary }]}
          >
            Active
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16, // Increased padding slightly for standard layout balance
    paddingVertical: 14,
    borderRadius: 8, // Rounded up slightly to align with modern card patterns
    borderWidth: 1.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6, // Changed from hard-box 3 to a cleaner hybrid pill layout
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default ActiveCheckbox;
