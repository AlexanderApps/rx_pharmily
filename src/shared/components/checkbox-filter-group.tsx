import React from "react";
import { View, Pressable } from "react-native";
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
    <ThemedView type="backgroundSecondary" className="w-full">
      {options.map((option) => {
        const selected = isSelected(option);

        return (
          <Pressable
            key={option}
            onPress={() => onToggleOption(option)}
            // Added side padding so pressed bg overlay looks balanced
            className="flex-row items-center justify-between py-3.5 px-4 border-b-[0.5px]"
            style={({ pressed }) => ({
              borderBottomColor: colors.border,
              // Soft overlay tint on tap to match the button states
              backgroundColor: pressed ? colors.backgroundElement : "transparent",
            })}
          >
            {/* Label */}
            <ThemedText>{option}</ThemedText>

            {/* Checkbox (Matches previous design) */}
            <View
              className="w-5 h-5 rounded ml-3 border-[1.5px] justify-center items-center"
              style={[
                { borderColor: colors.border },
                selected && { backgroundColor: colors.text, borderColor: colors.text },
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

