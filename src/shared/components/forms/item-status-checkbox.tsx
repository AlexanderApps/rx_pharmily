import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ItemStatusCheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}

const ItemStatusCheckbox: React.FC<ItemStatusCheckboxProps> = ({
  value,
  onChange,
  label,
  description,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        value && {
          backgroundColor: colors.success + "15",
          borderColor: colors.success,
        },
      ]}
      onPress={() => onChange(!value)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          value && {
            backgroundColor: colors.success,
            borderColor: colors.success,
          },
        ]}
      >
        {value && (
          <MaterialCommunityIcons name="check-bold" size={14} color="#fff" />
        )}
      </View>
      <View style={styles.content}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        )}
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {value && (
        <MaterialCommunityIcons
          name="check-circle"
          size={20}
          color={colors.success}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
    fontWeight: "400",
  },
});

export default ItemStatusCheckbox;
