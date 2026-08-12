import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/shared/components/themed-text";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "./themed-view";

interface RadioFilterGroupProps {
  options: string[];
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
}

export default function RadioFilterGroup({
  options,
  selectedOption,
  onSelectOption,
}: RadioFilterGroupProps) {
  const { colors } = useTheme();

  const isSelected = (option: string) => selectedOption === option;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {options.map((option) => {
        const selected = isSelected(option);
        return (
          <Pressable
            key={option}
            onPress={() => onSelectOption(option)}
            style={[
              styles.item,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            {/* Label */}
            <ThemedText>{option}</ThemedText>
            {/* Radio Button */}
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor: selected ? colors.icon : colors.border,
                },
              ]}
            >
              {selected && (
                <View
                  style={[
                    styles.radioInner,
                    {
                      backgroundColor: colors.icon,
                    },
                  ]}
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
