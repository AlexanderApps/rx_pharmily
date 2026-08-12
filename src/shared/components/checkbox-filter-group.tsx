import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ThemedText } from "@/shared/components/themed-text";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "./themed-view";

interface CheckboxFilterGroupProps {
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
}

export default function CheckboxFilterGroup({
  options,
  selectedOptions,
  onToggleOption,
}: CheckboxFilterGroupProps) {
  const { colors } = useTheme();

  const isSelected = (option: string) => selectedOptions.includes(option);

  return (
    <ThemedView type="backgroundSecondary" style={styles.container}>
      {options.map((option) => {
        const selected = isSelected(option);

        return (
          <Pressable
            key={option}
            onPress={() => onToggleOption(option)}
            style={({ pressed }) => [
              styles.item,
              {
                borderBottomColor: colors.border,
                // Soft overlay tint on tap to match the button states
                backgroundColor: pressed
                  ? colors.backgroundElement
                  : "transparent",
              },
            ]}
          >
            {/* Label */}
            <ThemedText>{option}</ThemedText>

            {/* Checkbox (Matches previous design) */}
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                selected && {
                  backgroundColor: colors.text,
                  borderColor: colors.text,
                },
              ]}
            >
              {selected && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={colors.backgroundSecondary}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16, // Added side padding so pressed bg overlay looks balanced
    borderBottomWidth: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
});
